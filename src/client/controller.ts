/**
 * Framework-free studio controller: the UI state the React tree renders.
 *
 * The Host stays the single fact source. Roster, composition documents, and
 * plugin inventory read through the wire; the only authoring write the Host
 * accepts — copy a preset by id — goes through the same seam. Composition
 * text the user edits is a working draft the studio validates and can export;
 * it never travels back to the Host (the Host deliberately refuses
 * composition writes: the seam exists so authoring grants no capability the
 * roster did not already carry).
 */
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'
import { appendRow, editRowConfig, removeRow as spliceRemoveRow } from '../core/edit.ts'
import { buildGraph } from '../core/graph.ts'
import type { HarnessGraph, StudioView } from '../core/types.ts'
import { parseComposition } from '../core/yaml.ts'
import { validateComposition, type ValidationResult } from '../core/validate.ts'
import type { AgentPresetDocument, AgentPresetRow, PluginInventorySnapshot, PresetStudioRemote } from './wire.ts'

/** Page lifecycle. */
export type StudioStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error'

/** Ids a preset directory may be named (the host's own rule). */
const PRESET_ID = /^[a-z0-9][a-z0-9-]*$/

/** The open copy dialog. */
export interface CopyDialogState {
  /** The preset being copied. */
  from: string
  /** Display name of the source, for the dialog title. */
  fromTitle: string
  /** New preset id being typed; the directory name, so it is required. */
  id: string
  /** Display name being typed; empty falls back to the id. */
  name: string
  /** Whether the copy is in flight. */
  saving: boolean
  /** The last copy failure, cleared by the next edit. */
  error: string | null
}

/** The controller snapshot React subscribes to. */
export interface PresetStudioState {
  status: StudioStatus
  /** Whole-load failure text; dialog failures stay on the dialog. */
  error: string | null
  /** Every preset the deployment currently supplies. */
  roster: readonly AgentPresetRow[]
  /** Whether the deployment configures a root new presets can be written to. */
  authorable: boolean
  /** The plugin inventory (installed entries + per-preset rows), when served. */
  inventory: PluginInventorySnapshot | null
  /** The preset being studied; null until the roster answers. */
  selectedId: string | null
  /** The selected preset's composition as stored on the Host. */
  content: string
  /** The working draft; seeded from content on every selection. */
  draft: string
  /** Whether the draft differs from the stored composition. */
  dirty: boolean
  /** Whether the selected preset ships with the deployment. */
  selectedTrust: 'system' | 'user' | null
  /** The active view. */
  view: StudioView
  /** The parsed draft projected as a graph; null while unparseable. */
  graph: HarnessGraph | null
  /** The draft's validation result. */
  validation: ValidationResult | null
  /** Selected graph node id. */
  selectedNodeId: string | null
  /** Diff side presets. */
  diffLeftId: string | null
  diffRightId: string | null
  diffLeftContent: string | null
  diffRightContent: string | null
  /** The open copy dialog, or null. */
  copyDialog: CopyDialogState | null
  /** The preset awaiting delete confirmation. */
  pendingDeleteId: string | null
  /** Whether a delete is in flight. */
  deleting: boolean
  /** Transient user feedback line. */
  notice: string | null
  /** Whether the full-page studio is open from the home entry. */
  homeOpen: boolean
}

const INITIAL: PresetStudioState = {
  status: 'idle',
  error: null,
  roster: [],
  authorable: false,
  inventory: null,
  selectedId: null,
  content: '',
  draft: '',
  dirty: false,
  selectedTrust: null,
  view: 'graph',
  graph: null,
  validation: null,
  selectedNodeId: null,
  diffLeftId: null,
  diffRightId: null,
  diffLeftContent: null,
  diffRightContent: null,
  copyDialog: null,
  pendingDeleteId: null,
  deleting: false,
  notice: null,
  homeOpen: false,
}

export interface PresetStudioControllerDefaults {
  defaultView?: StudioView
}

/** Display name a roster row presents. */
export function presetDisplayName(row: AgentPresetRow): string {
  return row.name ?? row.id
}

/** Parse a graph node id back into its index path (inverse of `r0.1`). */
export function nodeIndexPath(nodeId: string): number[] | null {
  if (!/^r\d+(\.\d+)*$/.test(nodeId)) return null
  return nodeId.slice(1).split('.').map(Number)
}

/**
 * Why this copy cannot be submitted yet, as a message, or undefined when it
 * can. Client-side only: the host re-checks the id and its answer is what
 * the dialog reports on failure.
 */
export function copyBlocker(draft: CopyDialogState, rows: readonly AgentPresetRow[]): string | undefined {
  if (draft.id === '') return 'copy.idRequired'
  if (!PRESET_ID.test(draft.id)) return 'copy.idInvalid'
  if (rows.some(row => row.id === draft.id)) return 'copy.idTaken'
  return undefined
}

/**
 * The preset studio controller.
 */
export class PresetStudioController {
  /** Page snapshot the renderer subscribes to. */
  readonly store: SnapshotStore<PresetStudioState> = createSnapshotStore(INITIAL)

  constructor(
    private readonly remote: PresetStudioRemote,
    defaults: PresetStudioControllerDefaults = {},
  ) {
    this.set({ view: defaults.defaultView ?? 'graph' })
  }

  /** Subscribe to snapshot changes. @returns unsubscribe. */
  subscribe(listener: () => void): () => void {
    return this.store.subscribe(listener)
  }

  /** The current snapshot (stable identity between mutations). */
  getSnapshot(): PresetStudioState {
    return this.store.getSnapshot()
  }

  private set(patch: Partial<PresetStudioState>): void {
    this.store.set({ ...this.store.getSnapshot(), ...patch })
  }

  private patchCopy(patch: Partial<CopyDialogState>): void {
    const { copyDialog } = this.store.getSnapshot()
    if (copyDialog === null) return
    this.set({ copyDialog: { ...copyDialog, ...patch } })
  }

  /** Recompute the graph and validation from the current draft. */
  private recomputeDraft(text: string): void {
    const validation = validateComposition(text)
    const parsed = parseComposition(text)
    const graph = parsed.rows === null ? null : buildGraph(parsed.rows)
    this.set({ validation, graph })
  }

  /**
   * Read one preset's composition into the draft.
   * @param id - the preset id.
   * @returns true when the document loaded.
   */
  private async openDocument(id: string): Promise<boolean> {
    const result = await this.remote.agentPresets.read(id)
    if (!result.ok) {
      this.set({ status: 'error', error: result.error.message, selectedId: id })
      return false
    }
    const document: AgentPresetDocument = result.value
    this.set({
      content: document.content,
      draft: document.content,
      dirty: false,
      selectedTrust: document.trust,
      selectedNodeId: null,
    })
    this.recomputeDraft(document.content)
    return true
  }

  /**
   * Load the roster, the plugin inventory, and the selected preset's
   * document. A roster with no presets is a valid deployment (`unavailable`);
   * the section renders an explanation instead of an empty studio.
   * @returns once the snapshot reflects the host.
   */
  async load(): Promise<void> {
    const before = this.store.getSnapshot()
    if (before.status === 'loading') return
    this.set({ status: 'loading', error: null })
    const roster = await this.remote.agentPresets.list()
    if (!roster.ok) {
      this.set({ status: 'error', error: roster.error.message })
      return
    }
    // The inventory is best-effort: a deployment without the inventory
    // gateway still gets the studio (palette falls back to the curated
    // registry alone).
    let inventory: PluginInventorySnapshot | null = null
    const inventoryResult = await this.remote.pluginInventory.list()
    if (inventoryResult.ok) inventory = inventoryResult.value

    const { presets, authorable } = roster.value
    if (presets.length === 0) {
      this.set({ status: 'unavailable', roster: [], authorable, inventory })
      return
    }
    const current = this.store.getSnapshot().selectedId
    const selected = current !== null && presets.some(preset => preset.id === current)
      ? current
      : (presets.find(preset => preset.isDefault) ?? presets[0]).id
    this.set({ status: 'ready', roster: presets, authorable, inventory, selectedId: selected })
    await this.openDocument(selected)
  }

  /** Study another preset: re-read its document and reset the draft. */
  async selectPreset(id: string): Promise<void> {
    this.set({ selectedId: id, error: null, notice: null, pendingDeleteId: null })
    await this.openDocument(id)
  }

  /** Switch the active view. */
  setView(view: StudioView): void {
    this.set({ view, notice: null })
  }

  /** Edit the working draft; the graph and validation follow immediately. */
  setDraft(text: string): void {
    const { content } = this.store.getSnapshot()
    this.set({ draft: text, dirty: text !== content, notice: null })
    this.recomputeDraft(text)
  }

  /** Select one graph node (null closes the inspector). */
  selectNode(id: string | null): void {
    this.set({ selectedNodeId: id })
  }

  /**
   * Write one schema-form field back into the draft: locate the row's source
   * lines, update its config at the dotted path, re-emit only that row, and
   * splice. The draft is untouched when it no longer parses or the path is
   * gone (the graph the user saw was derived from the same draft).
   * @param nodeId - the graph node (row) to edit.
   * @param path - dotted config path, e.g. `nested.flag`.
   * @param value - the value to store.
   * @returns true when the draft changed.
   */
  applyRowConfig(nodeId: string, path: string, value: unknown): boolean {
    const indexPath = nodeIndexPath(nodeId)
    if (indexPath === null) return false
    const next = editRowConfig(this.store.getSnapshot().draft, indexPath, path, value)
    if (next === null) return false
    this.setDraft(next)
    return true
  }

  /** Remove one row from the draft (its source lines only). */
  removeRow(nodeId: string): boolean {
    const indexPath = nodeIndexPath(nodeId)
    if (indexPath === null) return false
    const next = spliceRemoveRow(this.store.getSnapshot().draft, indexPath)
    if (next === null) return false
    this.set({ selectedNodeId: null })
    this.setDraft(next)
    return true
  }

  /** Append one YAML row block (palette drag / click) to the draft. */
  addRow(block: string): void {
    this.setDraft(appendRow(this.store.getSnapshot().draft, block))
  }

  /** Open the copy dialog over one preset. */
  beginCopy(from: string): void {
    const row = this.store.getSnapshot().roster.find(candidate => candidate.id === from)
    this.set({
      error: null,
      copyDialog: { from, fromTitle: presetDisplayName(row ?? { id: from, trust: 'system', isDefault: false }), id: '', name: '', saving: false, error: null },
    })
  }

  /** Close the copy dialog, discarding whatever was typed. */
  cancelCopy(): void {
    this.set({ copyDialog: null })
  }

  /** Name the preset the copy creates. */
  setCopyId(id: string): void {
    this.patchCopy({ id, error: null })
  }

  /** Name the copy's display name. */
  setCopyName(name: string): void {
    this.patchCopy({ name, error: null })
  }

  /**
   * Submit the copy (the host's only authoring write), re-read the roster,
   * then take the user to the new preset.
   * @returns once the copy settled and the page reflects it.
   */
  async confirmCopy(): Promise<void> {
    const { copyDialog, roster } = this.store.getSnapshot()
    if (copyDialog === null || copyDialog.saving) return
    if (copyBlocker(copyDialog, roster) !== undefined) return
    this.patchCopy({ saving: true, error: null })
    const name = copyDialog.name.trim()
    // Every declared parameter is passed even when optional: the Remote face
    // checks arity against the declaration and rejects a short call.
    const result = await this.remote.agentPresets.copy(copyDialog.from, copyDialog.id, name === '' ? undefined : name)
    if (!result.ok) {
      this.patchCopy({ saving: false, error: result.error.message })
      return
    }
    this.set({ copyDialog: null, notice: 'copy.created', selectedId: copyDialog.id })
    await this.load()
  }

  /** Ask for delete confirmation, or dismiss it with null. */
  confirmDelete(id: string | null): void {
    this.set({ pendingDeleteId: id })
  }

  /** Delete the preset awaiting confirmation (user-authored only). */
  async remove(): Promise<void> {
    const { pendingDeleteId, selectedId, roster } = this.store.getSnapshot()
    if (pendingDeleteId === null || this.store.getSnapshot().deleting) return
    this.set({ deleting: true, error: null })
    const result = await this.remote.agentPresets.deletePreset(pendingDeleteId)
    if (!result.ok) {
      this.set({ deleting: false, error: result.error.message, pendingDeleteId: null })
      return
    }
    const next = selectedId === pendingDeleteId
      ? (roster.find(row => row.id !== pendingDeleteId && row.isDefault) ?? roster.find(row => row.id !== pendingDeleteId))?.id ?? null
      : selectedId
    this.set({ deleting: false, pendingDeleteId: null, notice: 'deleted', selectedId: next })
    await this.load()
  }

  /** Choose one side of the diff; re-reads the document on each pick. */
  async setDiffSide(side: 'left' | 'right', id: string | null): Promise<void> {
    const patch: Partial<PresetStudioState> = side === 'left' ? { diffLeftId: id } : { diffRightId: id }
    this.set(patch)
    if (id === null) {
      this.set(side === 'left' ? { diffLeftContent: null } : { diffRightContent: null })
      return
    }
    const result = await this.remote.agentPresets.read(id)
    if (!result.ok) {
      this.set({ error: result.error.message })
      return
    }
    this.set(side === 'left' ? { diffLeftContent: result.value.content } : { diffRightContent: result.value.content })
  }

  /**
   * Open one preset's directory on the host desktop, or show its path.
   * @param id - the preset whose files the user wants.
   * @returns once the host answered.
   */
  async openPresetLocation(id: string): Promise<void> {
    const result = await this.remote.settings.openAgentPresetDirectory(id)
    if (!result.ok) {
      this.set({ error: result.error.message })
      return
    }
    if (result.value.opened) return
    this.set({ notice: `copy.path:${result.value.path}` })
  }

  /** Show one transient feedback line (a locale key or free text). */
  notify(text: string): void {
    this.set({ notice: text })
  }

  /** Open the full-page studio from the home entry. */
  openHome(): void {
    this.set({ homeOpen: true })
  }

  /** Close the full-page studio. */
  closeHome(): void {
    this.set({ homeOpen: false })
  }
}
