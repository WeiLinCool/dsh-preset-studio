/**
 * Preset Explorer rail: the roster as two groups (built-in / custom), with
 * row counts from the real plugin inventory and the per-preset actions.
 */
import { IconCopyOutline16, IconFolderOpenOutline16, IconTrashOutline16, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PresetStudioState } from '../controller.ts'
import { presetDisplayName } from '../controller.ts'
import type { AgentPresetRow } from '../wire.ts'
import css from '../presetstudio.module.css'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { PresetStudioKey } from '../locales.ts'

export interface ExplorerActions {
  selectPreset: (id: string) => void
  beginCopy: (from: string) => void
  confirmDelete: (id: string | null) => void
  openPresetLocation: (id: string) => void
}

interface ExplorerPanelProps {
  state: PresetStudioState
  actions: ExplorerActions
  t: Translate<PresetStudioKey>
}

/** One roster row. */
function PresetRow({ row, state, actions, t }: {
  row: AgentPresetRow
  state: PresetStudioState
  actions: ExplorerActions
  t: Translate<PresetStudioKey>
}) {
  const group = state.inventory?.agentPresets?.find(candidate => candidate.id === row.id)
  const rowCount = group === undefined ? undefined : group.rows.length
  const selected = state.selectedId === row.id
  return (
    <div className={selected ? `${css.presetRow} ${css.presetRowSelected}` : css.presetRow}>
      <button
        type="button"
        className={css.presetButton}
        onClick={() => { void actions.selectPreset(row.id) }}
        title={row.broken}
      >
        <span className={css.presetName}>{presetDisplayName(row)}</span>
        <span className={row.broken === undefined ? css.presetMeta : `${css.presetMeta} ${css.presetBroken}`}>
          {row.broken !== undefined
            ? t('badge.broken')
            : `${row.id}${rowCount === undefined ? '' : ` · ${rowCount} ${t('explorer.rows')}`}`}
        </span>
      </button>
      <Tooltip label={t('explorer.copy')}>
        <button type="button" className={css.rowAction} aria-label={t('explorer.copy')} onClick={() => { actions.beginCopy(row.id) }}>
          <IconCopyOutline16 size={14} />
        </button>
      </Tooltip>
      <Tooltip label={t('explorer.openFiles')}>
        <button type="button" className={css.rowAction} aria-label={t('explorer.openFiles')} onClick={() => { void actions.openPresetLocation(row.id) }}>
          <IconFolderOpenOutline16 size={14} />
        </button>
      </Tooltip>
      {row.trust === 'user'
        ? (
          <Tooltip label={t('explorer.delete')}>
            <button type="button" className={css.rowAction} aria-label={t('explorer.delete')} onClick={() => { actions.confirmDelete(row.id) }}>
              <IconTrashOutline16 size={14} />
            </button>
          </Tooltip>
        )
        : null}
    </div>
  )
}

/**
 * Render the explorer rail.
 * @param props - the page state, actions, and locale copy.
 * @returns the roster list grouped by trust.
 */
export function ExplorerPanel({ state, actions, t }: ExplorerPanelProps) {
  return (
    <div>
      <h3 className={css.railHead}>{t('explorer.title')}</h3>
      {(['system', 'user'] as const).map((trust) => {
        const rows = state.roster.filter(row => row.trust === trust)
        if (rows.length === 0) return null
        return (
          <div key={trust} className={css.group}>
            {rows.map(row => (
              <PresetRow key={row.id} row={row} state={state} actions={actions} t={t} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
