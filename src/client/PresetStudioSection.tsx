/**
 * Preset Studio body: the compact header (current preset + badges), the three
 * views (Harness Graph / Composition YAML / Diff), the copy dialog (the Host's
 * only authoring write), and the delete confirmation. Preset selection lives
 * in the graph view's explorer rail. Shared by every mount surface (full-page
 * home studio; formerly also the settings section).
 */
import { useEffect } from 'react'
import { Button, Modal, Pill } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, Translate } from '@deepseek-ai/dsh-client-ui-slots'
import { copyBlocker, presetDisplayName, type PresetStudioState } from './controller.ts'
import type { StudioView } from '../core/types.ts'
import type { PresetStudioKey } from './locales.ts'
import { GraphCanvas } from './graph/GraphCanvas.tsx'
import { ExplorerPanel } from './panels/ExplorerPanel.tsx'
import { PalettePanel } from './panels/PalettePanel.tsx'
import { InspectorPanel } from './panels/InspectorPanel.tsx'
import { ComposerPanel } from './panels/ComposerPanel.tsx'
import { DiffPanel } from './panels/DiffPanel.tsx'
import css from './presetstudio.module.css'

/** Registration-side business face for the studio body. */
export interface PresetStudioSectionInjected {
  hooks: {
    /** Page snapshot bound by the renderer as usePresetStudio. */
    presetStudio: SnapshotStore<PresetStudioState>
  }
  actions: {
    load: () => Promise<void>
    selectPreset: (id: string) => Promise<void>
    setView: (view: StudioView) => void
    setDraft: (text: string) => void
    selectNode: (id: string | null) => void
    applyRowConfig: (nodeId: string, path: string, value: unknown) => boolean
    removeRow: (nodeId: string) => boolean
    addRow: (block: string) => void
    beginCopy: (from: string) => void
    cancelCopy: () => void
    setCopyId: (id: string) => void
    setCopyName: (name: string) => void
    confirmCopy: () => Promise<void>
    confirmDelete: (id: string | null) => void
    remove: () => Promise<void>
    setDiffSide: (side: 'left' | 'right', id: string | null) => Promise<void>
    openPresetLocation: (id: string) => Promise<void>
    openHome: () => void
    closeHome: () => void
  }
}

/** Resolve the transient notice line into localized copy. */
function noticeText(notice: string, t: Translate<PresetStudioKey>): string {
  if (notice.startsWith('copy.path:')) {
    return t('notice.copyPath', { path: notice.slice('copy.path:'.length) })
  }
  if (notice === 'copy.created') return t('copy.created')
  if (notice === 'deleted') return t('notice.deleted')
  return notice
}

/** The view tabs. */
const VIEWS: readonly { id: StudioView; key: 'view.graph' | 'view.yaml' | 'view.diff' }[] = [
  { id: 'graph', key: 'view.graph' },
  { id: 'yaml', key: 'view.yaml' },
  { id: 'diff', key: 'view.diff' },
]

/**
 * The common studio body, rendered by the full-page home surface from the
 * same controller face.
 */
export interface PresetStudioBodyProps {
  /** Selector hook over the studio controller snapshot. */
  usePresetStudio: InjectFace<PresetStudioSectionInjected>['usePresetStudio']
  /** Locale seat. */
  t: Translate<PresetStudioKey>
  /** Bound controller actions. */
  actions: PresetStudioSectionInjected['actions']
}

/**
 * Render the studio body.
 * @param props - the bound store/actions and locale copy.
 * @returns the studio, or an unavailable/error/loading state.
 */
export function PresetStudioBody({ usePresetStudio, t, actions }: PresetStudioBodyProps) {
  const state = usePresetStudio(snapshot => snapshot)
  useEffect(() => { void actions.load() }, [actions])

  if (state.status === 'unavailable') {
    return (
      <div className={css.studio}>
        <h2 className={css.title}>{t('nav')}</h2>
        <p className={css.intro}>{t('unavailable.body')}</p>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className={css.studio}>
        <h2 className={css.title}>{t('nav')}</h2>
        <p className={css.errorLine}>{t('error')} {state.error ?? ''}</p>
        <Button variant="outline" onClick={() => { void actions.load() }}>{t('retry')}</Button>
      </div>
    )
  }
  if (state.status !== 'ready') {
    return (
      <div className={css.studio}>
        <p className={css.intro}>{t('loading')}</p>
      </div>
    )
  }

  const selectedRow = state.roster.find(row => row.id === state.selectedId)
  const copyDraft = state.copyDialog
  const copyBlocked = copyDraft === null ? undefined : copyBlocker(copyDraft, state.roster)
  const pendingDelete = state.pendingDeleteId === null ? undefined : state.roster.find(row => row.id === state.pendingDeleteId)

  return (
    <div className={css.studio}>
      <div className={css.header}>
        <h2 className={css.title}>{t('nav')}</h2>
        {selectedRow === undefined
          ? null
          : (
            <div className={css.meta}>
              <span className={css.currentName}>{presetDisplayName(selectedRow)}</span>
              <Pill className={selectedRow.trust === 'system' ? css.trustSystem : css.trustUser}>
                {t(selectedRow.trust === 'system' ? 'trust.system' : 'trust.user')}
              </Pill>
              {selectedRow.isDefault ? <Pill className={css.trustSystem}>{t('badge.default')}</Pill> : null}
              {selectedRow.broken === undefined ? null : <Pill className={css.trustUser}>{t('badge.broken')}</Pill>}
            </div>
          )}
      </div>
      {state.error === null ? null : <p className={css.errorLine} role="alert">{state.error}</p>}
      {state.notice === null ? null : <p className={css.notice} role="status">{noticeText(state.notice, t)}</p>}

      <nav className={css.tabs} aria-label={t('nav')}>
        {VIEWS.map(view => (
          <button
            key={view.id}
            type="button"
            className={state.view === view.id ? `${css.tab} ${css.tabActive}` : css.tab}
            aria-current={state.view === view.id ? 'page' : undefined}
            onClick={() => { actions.setView(view.id) }}
          >
            {t(view.key)}
          </button>
        ))}
      </nav>

      {state.view === 'graph' && state.graph !== null
        ? (
          <div className={css.graphBody}>
            <div className={css.rail}>
              <ExplorerPanel state={state} actions={actions} t={t} />
              <PalettePanel
                inventoryEntries={state.inventory?.entries ?? []}
                actions={actions}
                t={t}
              />
            </div>
            <GraphCanvas
              graph={state.graph}
              selectedNodeId={state.selectedNodeId}
              version={state.draft}
              actions={actions}
              emptyText={t('graph.empty')}
              legend={{
                data: t('graph.legend.sequence'),
                lifecycle: t('graph.legend.membership'),
                service: t('graph.legend.service'),
              }}
              kindLabels={{
                model: t('inspector.kind.model'),
                loop: t('inspector.kind.loop'),
                memory: t('inspector.kind.memory'),
                tool: t('inspector.kind.tool'),
                skill: t('inspector.kind.skill'),
                storage: t('inspector.kind.storage'),
                persona: t('inspector.kind.persona'),
                group: t('inspector.kind.group'),
                other: t('inspector.kind.other'),
              }}
              searchPlaceholder={t('graph.searchPlaceholder')}
              toolbarLabel={t('graph.toolbar')}
              clearLabel={t('graph.clear')}
            />
            <div className={`${css.rail} ${css.railRight}`}>
              <InspectorPanel
                graph={state.graph}
                selectedNodeId={state.selectedNodeId}
                selectedPresetId={state.selectedId}
                isSystemPreset={state.selectedTrust === 'system'}
                actions={actions}
                t={t}
              />
            </div>
          </div>
        )
        : null}
      {state.view === 'graph' && state.graph === null
        ? <p className={css.railHint}>{t('graph.empty')}</p>
        : null}
      {state.view === 'yaml'
        ? <ComposerPanel state={state} row={selectedRow} actions={actions} t={t} />
        : null}
      {state.view === 'diff'
        ? <DiffPanel state={state} actions={actions} t={t} />
        : null}

      {/* Copy dialog: the only composition write the Host accepts. */}
      <Modal
        open={copyDraft !== null}
        onClose={() => { actions.cancelCopy() }}
        title={t('copy.title')}
        closeLabel={t('close')}
        description={t('copy.intro')}
        footer={(
          <>
            <Button variant="outline" disabled={copyDraft?.saving === true} onClick={() => { actions.cancelCopy() }}>
              {t('copy.cancel')}
            </Button>
            <Button
              disabled={copyDraft === null || copyDraft.saving || copyBlocked !== undefined}
              onClick={() => { void actions.confirmCopy() }}
            >
              {copyDraft?.saving === true ? t('copy.creating') : t('copy.create')}
            </Button>
          </>
        )}
      >
        {copyDraft === null
          ? null
          : (
            <div>
              <p className={css.fieldLabel}>{t('copy.id')}</p>
              <input
                className={css.textInput}
                value={copyDraft.id}
                autoFocus
                spellCheck={false}
                placeholder={t('copy.idPlaceholder')}
                onChange={(event) => { actions.setCopyId(event.target.value) }}
              />
              <p className={css.fieldLabel}>{t('copy.name')}</p>
              <input
                className={css.textInput}
                value={copyDraft.name}
                spellCheck={false}
                placeholder={t('copy.namePlaceholder')}
                onChange={(event) => { actions.setCopyName(event.target.value) }}
              />
              {copyDraft.error !== null
                ? <p className={css.errorLine} role="alert">{copyDraft.error}</p>
                : copyBlocked === undefined
                  ? null
                  : <p className={css.errorLine} role="alert">{t(copyBlocked as PresetStudioKey)}</p>}
            </div>
          )}
      </Modal>

      {/* Delete confirmation. */}
      <Modal
        open={pendingDelete !== undefined}
        onClose={() => { actions.confirmDelete(null) }}
        title={`${t('explorer.deleteConfirm')} · ${pendingDelete === undefined ? '' : presetDisplayName(pendingDelete)}`}
        closeLabel={t('close')}
        description={t('explorer.deleteBody')}
        footer={(
          <>
            <Button variant="outline" disabled={state.deleting} onClick={() => { actions.confirmDelete(null) }}>
              {t('copy.cancel')}
            </Button>
            <Button disabled={state.deleting} onClick={() => { void actions.remove() }}>
              {state.deleting ? t('explorer.deleting') : t('explorer.delete')}
            </Button>
          </>
        )}
      />
    </div>
  )
}
