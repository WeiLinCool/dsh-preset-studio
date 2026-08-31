/**
 * Preset diff view (spec §九): one side-by-side picker, the line diff through
 * the official DiffBlock primitive, and a row-set summary answering which
 * capability rows were added / removed.
 */
import { useMemo } from 'react'
import { DiffBlock } from '@deepseek-ai/dsh-client-ui-primitives'
import { diffRows } from '../../core/diff.ts'
import type { PresetStudioState } from '../controller.ts'
import { presetDisplayName } from '../controller.ts'
import css from '../presetstudio.module.css'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { PresetStudioKey } from '../locales.ts'

export interface DiffActions {
  setDiffSide: (side: 'left' | 'right', id: string | null) => void
}

interface DiffPanelProps {
  state: PresetStudioState
  actions: DiffActions
  t: Translate<PresetStudioKey>
}

/** One side's picker. */
function SidePicker({ side, state, actions, t }: {
  side: 'left' | 'right'
  state: PresetStudioState
  actions: DiffActions
  t: Translate<PresetStudioKey>
}) {
  const value = side === 'left' ? state.diffLeftId : state.diffRightId
  return (
    <div>
      <p className={css.detailLabel}>{side === 'left' ? t('diff.pickLeft') : t('diff.pickRight')}</p>
      <select
        className={css.select}
        value={value ?? ''}
        onChange={(event) => { void actions.setDiffSide(side, event.target.value === '' ? null : event.target.value) }}
      >
        <option value="">—</option>
        {state.roster.map(row => (
          <option key={row.id} value={row.id}>{presetDisplayName(row)}</option>
        ))}
      </select>
    </div>
  )
}

/**
 * Render the diff view.
 * @param props - the page state, actions, and locale copy.
 * @returns the pickers, the DiffBlock, and the row-set summary.
 */
export function DiffPanel({ state, actions, t }: DiffPanelProps) {
  const rowDiff = useMemo(() => {
    if (state.diffLeftContent === null || state.diffRightContent === null) return null
    return diffRows(state.diffLeftContent, state.diffRightContent)
  }, [state.diffLeftContent, state.diffRightContent])

  const ready = state.diffLeftContent !== null && state.diffRightContent !== null
  const identical = ready && state.diffLeftContent === state.diffRightContent
  const hunks = ready
    ? [{ path: `${state.diffLeftId}/agent.cordis.yml`, oldText: state.diffLeftContent!, newText: state.diffRightContent! }]
    : []

  return (
    <div>
      <div className={css.diffPickers}>
        <SidePicker side="left" state={state} actions={actions} t={t} />
        <SidePicker side="right" state={state} actions={actions} t={t} />
      </div>
      {!ready
        ? <p className={css.railHint}>{t('diff.empty')}</p>
        : identical
          ? <p className={css.railHint}>{t('diff.samePreset')}</p>
          : (
            <div className={css.diffBlock}>
              <DiffBlock
                diffs={hunks}
                labels={{
                  copy: t('diff.labels.copy'),
                  copied: t('diff.labels.copied'),
                  collapseAria: t('diff.labels.collapseAria'),
                  expandAria: (hidden: number) => t('diff.labels.expand', { count: String(hidden) }),
                  collapse: t('diff.labels.collapse'),
                  expand: (hidden: number) => t('diff.labels.expand', { count: String(hidden) }),
                  files: (count: number) => t('diff.labels.files', { count: String(count) }),
                }}
              />
            </div>
          )}
      {rowDiff === null
        ? null
        : (
          <div className={css.diffSummary}>
            <div className={`${css.diffCount} ${css.diffCountAdded}`}>
              {t('diff.rowsAdded')}: {rowDiff.added.length}
            </div>
            <div className={`${css.diffCount} ${css.diffCountRemoved}`}>
              {t('diff.rowsRemoved')}: {rowDiff.removed.length}
            </div>
            <div className={`${css.diffCount} ${css.diffCountUnchanged}`}>
              {t('diff.rowsUnchanged')}: {rowDiff.unchanged.length}
            </div>
            {rowDiff.added.length > 0
              ? (
                <ul className={css.diffList}>
                  {rowDiff.added.map(row => (
                    <li key={`+${row.id ?? ''}:${row.moduleName}`}>+ {row.id === undefined ? row.moduleName : `${row.id} (${row.moduleName})`}</li>
                  ))}
                </ul>
              )
              : null}
            {rowDiff.removed.length > 0
              ? (
                <ul className={css.diffList}>
                  {rowDiff.removed.map(row => (
                    <li key={`-${row.id ?? ''}:${row.moduleName}`}>− {row.id === undefined ? row.moduleName : `${row.id} (${row.moduleName})`}</li>
                  ))}
                </ul>
              )
              : null}
          </div>
        )}
    </div>
  )
}
