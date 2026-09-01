/**
 * The canvas add-node context menu: right-click a node (or use the ＋ on a
 * selected node) to insert a related component by capability category. The
 * menu ranks categories relative to the clicked node; group anchors may add
 * either a sibling or a member inside the group. Null anchor appends to the
 * composition end (the global ＋ entry on an empty canvas).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CapabilityKind, HarnessNode } from '../../core/types.ts'
import {
  addableEntries, filterAddableEntries, groupAddableEntries, KIND_ORDER, relatedKindOrder, type AddableEntry,
} from '../addable.ts'
import type { PluginInventoryEntry } from '../wire.ts'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { PresetStudioKey } from '../locales.ts'
import css from '../presetstudio.module.css'
import { KIND_CLASS, shortModule } from './HarnessNode.tsx'

/** Where a picked item lands relative to the anchor node. */
export type AddMode = 'after' | 'group'

export interface NodeContextMenuProps {
  /** Anchor node, or null for append-at-end (no anchor). */
  anchor: HarnessNode | null
  /** Viewport position the menu opens at. */
  x: number
  y: number
  inventoryEntries: readonly PluginInventoryEntry[]
  kindLabels: Readonly<Record<CapabilityKind, string>>
  /** Modules already present in the composition (disabled in the menu). */
  existingModules: ReadonlySet<string>
  t: Translate<PresetStudioKey>
  onPick: (entry: AddableEntry, mode: AddMode) => void
  onClose: () => void
}

/**
 * Render the add-node context menu.
 * @param props - anchor/data/copy and the pick-close callbacks.
 * @returns the floating, grouped, category-ordered insert menu.
 */
export function NodeContextMenu({
  anchor, x, y, inventoryEntries, kindLabels, existingModules, t, onPick, onClose,
}: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<AddMode>(anchor?.hasChildren === true ? 'group' : 'after')
  const [query, setQuery] = useState('')
  const [activeKind, setActiveKind] = useState<CapabilityKind | null>(null)

  const entries = useMemo(() => addableEntries(inventoryEntries), [inventoryEntries])
  /** Kinds that have at least one addable item (category chips). */
  const availableKinds = useMemo(() => {
    const present = new Set(entries.map(entry => entry.kind))
    return KIND_ORDER.filter(kind => present.has(kind))
  }, [entries])
  const filteredEntries = useMemo(
    () => filterAddableEntries(entries, query, activeKind, kindLabels),
    [entries, query, activeKind, kindLabels],
  )
  const grouped = useMemo(() => groupAddableEntries(filteredEntries), [filteredEntries])
  const kindOrder = useMemo(
    () => relatedKindOrder(anchor?.kind ?? 'other', grouped.keys()),
    [anchor, grouped],
  )

  // Close on outside pointer, Escape, or viewport resize.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent): void => {
      if (ref.current !== null && !ref.current.contains(event.target as Node)) onClose()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onClose)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])

  const left = Math.max(8, Math.min(x, window.innerWidth - 348))
  const top = Math.max(8, Math.min(y, window.innerHeight - 460))
  const anchorLabel = anchor === null
    ? t('graph.addEmptyHint')
    : `${shortModule(anchor.moduleName) || anchor.rowId || anchor.id} · ${anchor.rowId ?? anchor.id}`

  return (
    <div ref={ref} className={css.nodeMenu} style={{ left, top }} role="menu" aria-label={t('graph.addMenuAria')}>
      <div className={css.nodeMenuHead}>
        <span className={css.nodeMenuTitle}>{anchor === null ? t('graph.addEmpty') : t('graph.addRelated')}</span>
        <span className={css.nodeMenuAnchor}>{anchorLabel}</span>
      </div>
      <div className={css.nodeMenuFilter}>
        <input
          className={css.nodeMenuInput}
          type="text"
          value={query}
          placeholder={t('graph.addFilterPlaceholder')}
          aria-label={t('graph.addFilterPlaceholder')}
          onChange={(event) => { setQuery(event.target.value) }}
        />
        <div className={css.nodeMenuChips} role="group" aria-label={t('graph.addFilterKind')}>
          <button
            type="button"
            className={activeKind === null ? `${css.nodeMenuChip} ${css.nodeMenuChipActive}` : css.nodeMenuChip}
            aria-pressed={activeKind === null}
            onClick={() => { setActiveKind(null) }}
          >
            {t('graph.addFilterAll')}
          </button>
          {availableKinds.map(kind => (
            <button
              key={kind}
              type="button"
              className={activeKind === kind ? `${css.nodeMenuChip} ${css.nodeMenuChipActive}` : css.nodeMenuChip}
              aria-pressed={activeKind === kind}
              onClick={() => { setActiveKind(activeKind === kind ? null : kind) }}
            >
              <span className={`${css.kindDot} ${KIND_CLASS[kind] ?? css.kindOther}`} />
              {kindLabels[kind]}
            </button>
          ))}
        </div>
      </div>
      {anchor !== null && anchor.hasChildren
        ? (
          <div className={css.nodeMenuModes} role="group" aria-label={t('graph.addMode')}>
            <button
              type="button"
              className={mode === 'group' ? `${css.nodeMenuMode} ${css.nodeMenuModeActive}` : css.nodeMenuMode}
              aria-pressed={mode === 'group'}
              onClick={() => { setMode('group') }}
            >
              {t('graph.addToGroup')}
            </button>
            <button
              type="button"
              className={mode === 'after' ? `${css.nodeMenuMode} ${css.nodeMenuModeActive}` : css.nodeMenuMode}
              aria-pressed={mode === 'after'}
              onClick={() => { setMode('after') }}
            >
              {t('graph.addAfter')}
            </button>
          </div>
        )
        : null}
      <div className={css.nodeMenuBody}>
        {kindOrder.map((kind) => {
          const items = grouped.get(kind) ?? []
          if (items.length === 0) return null
          return (
            <div key={kind} className={css.nodeMenuGroup}>
              <div className={css.nodeMenuGroupTitle}>
                <span className={`${css.kindDot} ${KIND_CLASS[kind] ?? css.kindOther}`} />
                {kindLabels[kind]}
              </div>
              {items.map(item => {
                const exists = existingModules.has(item.module)
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={exists
                      ? `${css.nodeMenuItem} ${css.nodeMenuItemDisabled}`
                      : css.nodeMenuItem}
                    disabled={exists}
                    role="menuitem"
                    title={item.description}
                    onClick={() => { onPick(item, mode) }}
                  >
                    <span className={css.nodeMenuItemName}>{item.label}</span>
                    <span className={css.nodeMenuItemModule}>
                      {shortModule(item.module)}
                      {exists ? ` · ${t('graph.alreadyExists')}` : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
        {entries.length === 0
          ? <p className={css.nodeMenuEmpty}>{t('graph.menuEmpty')}</p>
          : filteredEntries.length === 0
            ? <p className={css.nodeMenuEmpty}>{t('graph.addFilterEmpty')}</p>
            : null}
      </div>
    </div>
  )
}
