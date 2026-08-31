/**
 * Node inspector: one selected row's identity, enablement, and config — the
 * schema-driven form when the bundled registry knows the module, raw JSON
 * always — plus row removal from the working draft.
 */
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { registryEntry } from '../../core/registry.ts'
import type { HarnessGraph } from '../../core/types.ts'
import { SchemaForm, type SchemaFormActions } from '../SchemaForm.tsx'
import css from '../presetstudio.module.css'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { PresetStudioKey } from '../locales.ts'

export interface InspectorActions extends SchemaFormActions {
  removeRow: (nodeId: string) => boolean
  beginCopy: (from: string) => void
}

interface InspectorPanelProps {
  graph: HarnessGraph
  selectedNodeId: string | null
  /** The preset being studied (the copy-as-new source). */
  selectedPresetId: string | null
  isSystemPreset: boolean
  actions: InspectorActions
  t: Translate<PresetStudioKey>
}

/**
 * Render the inspector rail.
 * @param props - the graph, selection, whether the preset is built-in,
 * actions, and locale copy.
 * @returns the selected node's details, or an empty-state note.
 */
export function InspectorPanel({ graph, selectedNodeId, selectedPresetId, isSystemPreset, actions, t }: InspectorPanelProps) {
  const node = graph.nodes.find(candidate => candidate.id === selectedNodeId)
  if (node === undefined) {
    return (
      <div className={css.inspector}>
        <h3 className={css.railHead}>{t('inspector.title')}</h3>
        <p className={css.inspectorEmpty}>{t('inspector.empty')}</p>
      </div>
    )
  }
  const entry = registryEntry(node.moduleName)
  const enabledLabel = node.enabled === true ? t('inspector.enabled')
    : node.enabled === false ? t('inspector.disabled')
      : `${t('inspector.conditional')}${node.condition === undefined ? '' : `: ${node.condition}`}`
  return (
    <div className={css.inspector}>
      <h3 className={css.railHead}>{t('inspector.title')}</h3>
      <div className={css.detailBlock}>
        <p className={css.detailLabel}>{t('inspector.rowId')}</p>
        <p className={css.detailValue}>{node.rowId ?? node.id}</p>
      </div>
      <div className={css.detailBlock}>
        <p className={css.detailLabel}>{t('inspector.module')}</p>
        <p className={css.detailValue}>{node.moduleName ?? '—'}</p>
      </div>
      <div className={css.detailBlock}>
        <p className={css.detailLabel}>{t('inspector.kind')}</p>
        <p className={css.detailValue}>{t(`inspector.kind.${node.kind}`)}</p>
      </div>
      <div className={css.detailBlock}>
        <p className={css.detailLabel}>{t('inspector.enabled')}</p>
        <p className={css.detailValue}>{enabledLabel}</p>
      </div>
      <div className={css.detailBlock}>
        <p className={css.detailLabel}>{t('inspector.config')}</p>
        {entry?.configSchema !== undefined
          ? <SchemaForm schema={entry.configSchema} node={node} actions={actions} />
          : <p className={css.inspectorEmpty}>{t('inspector.noSchema')}</p>}
        <pre className={css.pre}>{JSON.stringify(node.config ?? null, null, 2)}</pre>
        {entry?.configSchema !== undefined
          ? <p className={css.formNote}>{t('inspector.formNote')}</p>
          : null}
      </div>
      <div className={css.inspectorActions}>
        <Button variant="outline" onClick={() => { actions.removeRow(node.id) }}>
          {t('explorer.delete')}
        </Button>
        {isSystemPreset && selectedPresetId !== null
          ? <Button variant="outline" onClick={() => { actions.beginCopy(selectedPresetId) }}>{t('composer.copyAsNew')}</Button>
          : null}
      </div>
      {isSystemPreset ? <p className={css.formNote}>{t('inspector.readonly')}</p> : null}
    </div>
  )
}
