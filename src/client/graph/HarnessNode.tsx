/**
 * One Harness Graph node: a composition row projected as a Runtime
 * Capability card — row id, module, capability kind, enablement state.
 */
import { Handle, Position } from '@xyflow/react'
import type { HarnessNode } from '../../core/types.ts'
import css from '../presetstudio.module.css'

/** ReactFlow node payload. */
export interface HarnessNodeData {
  /** The capability row this node projects. */
  node: HarnessNode
}

/** Kind → CSS module class (the dot color). */
const KIND_CLASS: Readonly<Record<string, string>> = {
  model: css.kindModel,
  loop: css.kindLoop,
  memory: css.kindMemory,
  tool: css.kindTool,
  skill: css.kindSkill,
  storage: css.kindStorage,
  persona: css.kindPersona,
  group: css.kindGroup,
  other: css.kindOther,
}

/** Short display form of a module specifier. */
function shortModule(moduleName: string | undefined): string {
  if (moduleName === undefined) return ''
  return moduleName.replace(/^@deepseek-ai\/dsh-/, '').replace(/^@deepseek-ai\//, '')
}

interface HarnessNodeViewProps {
  data: HarnessNodeData
  selected?: boolean
}

/** Render one harness node. */
export function HarnessNodeView({ data, selected = false }: HarnessNodeViewProps) {
  const { node } = data
  const stateClass = node.enabled === true ? css.stateOn : node.enabled === false ? css.stateOff : css.stateConditional
  const stateLabel = node.enabled === true ? 'on' : node.enabled === false ? 'off' : 'conditional'
  const boxClass = [
    css.node,
    node.kind === 'group' ? css.nodeGroup : '',
    selected ? css.nodeSelected : '',
  ].filter(Boolean).join(' ')
  return (
    <div className={boxClass} data-kind={node.kind}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className={css.nodeHead}>
        <span className={`${css.kindDot} ${KIND_CLASS[node.kind] ?? css.kindOther}`} />
        <span className={css.nodeRowId}>{node.rowId ?? node.id}</span>
        <span className={css.nodeName}>{shortModule(node.moduleName) || node.rowId || node.id}</span>
      </div>
      {node.moduleName === undefined
        ? <div className={css.nodeModule}>—</div>
        : node.moduleName !== shortModule(node.moduleName)
          ? <div className={css.nodeModule}>{node.moduleName}</div>
          : null}
      <div className={css.nodeFoot}>
        <span className={`${css.stateDot} ${stateClass}`} />
        <span className={css.nodeState} data-state={stateLabel}>
          {node.enabled === true ? 'enabled' : node.enabled === false ? 'disabled' : `conditional${node.condition === undefined ? '' : ` · ${node.condition}`}`}
        </span>
        {node.hasChildren ? <span className={css.nodeState}>· group</span> : null}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}
