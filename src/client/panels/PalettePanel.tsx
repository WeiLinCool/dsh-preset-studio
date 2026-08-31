/**
 * Components / Plugins palette: the curated registry grouped by capability
 * kind plus the real installed plugin inventory. Every item can be clicked
 * or dragged onto the canvas to append its YAML template to the draft.
 */
import type { DragEvent } from 'react'
import { REGISTRY } from '../../core/registry.ts'
import type { CapabilityKind, RegistryEntry } from '../../core/types.ts'
import type { PluginInventoryEntry } from '../wire.ts'
import css from '../presetstudio.module.css'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { PresetStudioKey } from '../locales.ts'

export interface PaletteActions {
  addRow: (block: string) => void
}

interface PalettePanelProps {
  inventoryEntries: readonly PluginInventoryEntry[]
  actions: PaletteActions
  t: Translate<PresetStudioKey>
}

/** Palette display order of capability kinds. */
const KIND_ORDER: readonly CapabilityKind[] = ['model', 'loop', 'memory', 'tool', 'skill', 'storage', 'persona', 'other']

/** Begin dragging one palette item: the YAML template rides the drag payload. */
function startDrag(event: DragEvent<HTMLDivElement>, block: string): void {
  event.dataTransfer.setData('text/plain', block)
  event.dataTransfer.effectAllowed = 'copy'
}

/** One palette item. */
function PaletteItem({ entry, actions }: { entry: RegistryEntry; actions: PaletteActions }) {
  return (
    <div
      className={css.paletteItem}
      draggable
      onDragStart={(event) => { startDrag(event, entry.template) }}
      onClick={() => { actions.addRow(entry.template) }}
      title={entry.description}
    >
      <div className={css.paletteName}>{entry.label}</div>
      <div className={css.paletteDesc}>{entry.module}</div>
    </div>
  )
}

/** One installed-plugin item outside the registry (no schema, no template). */
function InstalledItem({ entry, actions }: { entry: PluginInventoryEntry; actions: PaletteActions }) {
  const template = `- id: plugin-${entry.moduleName.replace(/[^a-z0-9-]/g, '-').slice(-24)}\n  name: '${entry.moduleName}'`
  return (
    <div
      className={css.paletteItem}
      draggable
      onDragStart={(event) => { startDrag(event, template) }}
      onClick={() => { actions.addRow(template) }}
      title={entry.moduleName}
    >
      <div className={css.paletteName}>{entry.moduleName.replace(/^@deepseek-ai\/dsh-/, '')}</div>
      <div className={css.paletteDesc}>{entry.moduleName}</div>
    </div>
  )
}

/**
 * Render the palette rail.
 * @param props - installed entries, actions, and locale copy.
 * @returns the registry grouped by kind, then the unregistered inventory.
 */
export function PalettePanel({ inventoryEntries, actions, t }: PalettePanelProps) {
  const registered = new Set(REGISTRY.map(entry => entry.module))
  const unregistered = inventoryEntries.filter(entry => !registered.has(entry.moduleName))
  return (
    <div>
      <h3 className={css.railHead}>{t('palette.title')}</h3>
      <p className={css.railHint}>{t('palette.hint')}</p>
      {KIND_ORDER.map((kind) => {
        const entries = REGISTRY.filter(entry => entry.kind === kind)
        if (entries.length === 0) return null
        return (
          <div key={kind} className={css.group}>
            <div className={css.paletteGroup}>{t(`inspector.kind.${kind}`)}</div>
            {entries.map(entry => <PaletteItem key={entry.module} entry={entry} actions={actions} />)}
          </div>
        )
      })}
      {unregistered.length > 0
        ? (
          <div className={css.group}>
            <div className={css.paletteGroup}>{t('palette.installed')}</div>
            <p className={css.railHint}>{t('palette.installedHint')}</p>
            {unregistered.slice(0, 24).map(entry => <InstalledItem key={entry.moduleName} entry={entry} actions={actions} />)}
          </div>
        )
        : null}
    </div>
  )
}
