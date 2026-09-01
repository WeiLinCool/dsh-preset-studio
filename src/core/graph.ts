/**
 * Harness Graph builder: composition rows → DAG nodes and edges.
 *
 * Edge derivation is conservative — every edge is provable from the file:
 * - `lifecycle`: a group row owns its members (the group's realm initializes
 *   before the rows inside it);
 * - `data`: consecutive sibling rows, the loader's composition order;
 * - `service`: a row whose curated registry entry consumes a service another
 *   row's entry provides (declarative knowledge from the bundled registry).
 * `event` and `context` stay reserved in the DSL: they describe runtime flow
 * and are only derivable from a live trace (Phase 2 of the spec).
 * @module @weilin-cool/dsh-preset-studio/src/core/graph
 */

import { classifyModule } from './classify.ts'
import { registryEntry } from './registry.ts'
import type { CompositionDiagnostic, CompositionRow, EdgeType, HarnessEdge, HarnessGraph, HarnessNode } from './types.ts'
import { flattenRows, jsExpressionText, nodeId } from './yaml.ts'

/**
 * Resolve a row's file-level enablement.
 * @param disabled - the row's raw `disabled` node.
 * @returns true when absent, false when literally disabled, `'conditional'`
 * for a `!!js` expression (only a loader context can decide it), or for any
 * other non-boolean value.
 */
function resolveEnablement(disabled: unknown): HarnessNode['enabled'] {
  if (disabled === undefined) return true
  if (typeof disabled === 'boolean') return !disabled
  return 'conditional'
}

/** True when the node carries a `!!js` disabled expression worth showing. */
function disabledExpression(disabled: unknown): string | undefined {
  return jsExpressionText(disabled)
}

/** Build one node from one row. */
function buildNode(row: CompositionRow): HarnessNode {
  const entry = registryEntry(row.name)
  return {
    id: nodeId(row.index),
    ...row.id === undefined ? {} : { rowId: row.id },
    ...row.name === undefined ? {} : { moduleName: row.name },
    kind: entry?.kind ?? classifyModule(row.name),
    depth: row.index.length - 1,
    ...row.index.length > 1 ? { parentId: nodeId(row.index.slice(0, -1)) } : {},
    hasChildren: row.children.length > 0,
    enabled: resolveEnablement(row.disabled),
    ...disabledExpression(row.disabled) === undefined ? {} : { condition: disabledExpression(row.disabled) },
    ...row.config === undefined ? {} : { config: row.config },
    provides: entry?.provides ?? [],
    consumes: entry?.consumes ?? [],
    known: entry !== undefined,
  }
}

/**
 * Build the Harness Graph for one composition.
 * @param rows - the parsed top-level rows (parse failures are the caller's
 * diagnostics; this builder reports structural problems it can see).
 * @returns the graph: nodes in document order, provable edges, diagnostics.
 */
export function buildGraph(rows: readonly CompositionRow[]): HarnessGraph {
  const flat = flattenRows(rows)
  const nodes: HarnessNode[] = flat.map(buildNode)
  const edges: HarnessEdge[] = []
  const diagnostics: CompositionDiagnostic[] = []

  // Declared-id duplicates: the loader keys entries by id, so a duplicate is
  // a real composition bug worth surfacing.
  const seenIds = new Map<string, string>()
  for (const node of nodes) {
    if (node.rowId === undefined) continue
    const first = seenIds.get(node.rowId)
    if (first !== undefined) {
      diagnostics.push({
        severity: 'warning',
        message: `重复的 row id "${node.rowId}"（首次出现在 ${first}）`,
        index: node.id,
      })
    } else {
      seenIds.set(node.rowId, node.id)
    }
  }

  // lifecycle: group → member.
  for (const node of nodes) {
    if (node.parentId !== undefined) {
      edges.push({ id: `lifecycle:${node.parentId}->${node.id}`, source: node.parentId, target: node.id, type: 'lifecycle' })
    }
  }

  // data: consecutive siblings in composition order.
  const siblingLists = new Map<string, HarnessNode[]>()
  for (const node of nodes) {
    const key = node.parentId ?? ''
    const list = siblingLists.get(key) ?? []
    list.push(node)
    siblingLists.set(key, list)
  }
  for (const siblings of siblingLists.values()) {
    for (let i = 0; i + 1 < siblings.length; i++) {
      const a = siblings[i]
      const b = siblings[i + 1]
      edges.push({ id: `data:${a.id}->${b.id}`, source: a.id, target: b.id, type: 'data' })
    }
  }

  // service: declarative provides/consumes, composition-wide. The curated
  // registry states what a row publishes and what a row reads (e.g. persona
  // publishes the system-prompt plane, subagent/workflow rows read it), so a
  // service edge spans groups — unlike a lifecycle edge, which never crosses
  // a realm boundary.
  for (const consumer of nodes) {
    for (const provider of nodes) {
      if (consumer.id === provider.id) continue
      if (consumer.consumes.length === 0 || provider.provides.length === 0) continue
      const shared = consumer.consumes.find(service => provider.provides.includes(service))
      if (shared === undefined) continue
      edges.push({ id: `service:${provider.id}->${consumer.id}`, source: provider.id, target: consumer.id, type: 'service' as EdgeType })
    }
  }

  // Structural problems this builder owns: rows without a name, and rows
  // whose disablement is not a boolean nor a `!!js` expression.
  for (const node of nodes) {
    const row = flat.find(candidate => nodeId(candidate.index) === node.id)
    if (row === undefined) continue
    if (node.moduleName === undefined) {
      diagnostics.push({
        severity: 'error',
        message: '缺少 name：该行不是可加载的 plugin row',
        index: node.id,
      })
    }
    if (row.disabled !== undefined && node.enabled === 'conditional' && node.condition === undefined) {
      diagnostics.push({
        severity: 'warning',
        message: 'disabled 不是布尔值也不是 !!js 表达式，loader 会按 truthiness 求值',
        index: node.id,
      })
    }
  }

  return { nodes, edges, diagnostics }
}