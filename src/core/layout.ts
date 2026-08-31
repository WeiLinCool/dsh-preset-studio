/**
 * Graph layout: dagre hierarchical placement for HarnessGraph nodes.
 *
 * Compositions are small (a preset is tens of rows) and inherently ordered,
 * so the studio ships the dagre layout only — the spec's d3-force/ELK
 * alternatives stay out until graphs outgrow hierarchy.
 * @module @tieveto666-code/dsh-preset-studio/src/core/layout
 */

import dagre from '@dagrejs/dagre'
import type { HarnessEdge, HarnessNode } from './types.ts'

/** Assumed node size (matches the node box in presetstudio.module.css). */
export const NODE_WIDTH = 240
export const NODE_HEIGHT = 76

/** A laid-out point: ReactFlow top-left coordinates. */
export interface Point {
  x: number
  y: number
}

/**
 * Lay one Harness Graph out top-to-bottom.
 * @param nodes - the graph nodes.
 * @param edges - the graph edges.
 * @returns node id → top-left position; every node gets a finite position.
 */
export function layoutGraph(nodes: readonly HarnessNode[], edges: readonly HarnessEdge[]): Map<string, Point> {
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: 'TB', nodesep: 48, ranksep: 96, marginx: 32, marginy: 32 })
  graph.setDefaultEdgeLabel(() => ({}))
  for (const node of nodes) graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const edge of edges) graph.setEdge(edge.source, edge.target)
  dagre.layout(graph)
  const out = new Map<string, Point>()
  for (const node of nodes) {
    const position = graph.node(node.id) as { x: number; y: number } | undefined
    if (position === undefined) continue
    out.set(node.id, { x: position.x - NODE_WIDTH / 2, y: position.y - NODE_HEIGHT / 2 })
  }
  return out
}
