/**
 * The Harness Graph canvas: dagre-laid-out composition DAG on ReactFlow, with
 * the palette drop target and the edge-type legend.
 */
import { useMemo } from 'react'
import { Background, BackgroundVariant, Controls, ReactFlow, type Edge, type Node } from '@xyflow/react'
import { layoutGraph } from '../../core/layout.ts'
import type { HarnessGraph } from '../../core/types.ts'
import css from '../presetstudio.module.css'
import { HarnessEdgeView, type HarnessEdgeData } from './HarnessEdge.tsx'
import { HarnessNodeView, type HarnessNodeData } from './HarnessNode.tsx'

export interface GraphCanvasActions {
  selectNode: (id: string | null) => void
  addRow: (block: string) => void
}

interface GraphCanvasProps {
  graph: HarnessGraph
  selectedNodeId: string | null
  /** Remount key: changes when the draft changes, so layouts stay fresh. */
  version: string
  actions: GraphCanvasActions
  emptyText: string
  legend: { data: string; lifecycle: string; service: string }
}

/** The canvas node types (stable identity — ReactFlow re-creates on change). */
const nodeTypes = { harness: HarnessNodeView }
const edgeTypes = { harness: HarnessEdgeView }

/**
 * Render the graph canvas.
 * @param props - the graph, selection, remount key, actions, and copy.
 * @returns the ReactFlow canvas.
 */
export function GraphCanvas({ graph, selectedNodeId, version, actions, emptyText, legend }: GraphCanvasProps) {
  const laid = useMemo(() => layoutGraph(graph.nodes, graph.edges), [graph])
  const nodes = useMemo<Node[]>(() => graph.nodes.map((node) => ({
    id: node.id,
    type: 'harness',
    position: laid.get(node.id) ?? { x: 0, y: 0 },
    data: { node } satisfies HarnessNodeData,
    draggable: true,
  })), [graph, laid])
  const edges = useMemo<Edge[]>(() => graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'harness',
    data: { edgeType: edge.type } satisfies HarnessEdgeData,
  })), [graph])

  return (
    <div className={css.canvas} data-dsh-preset-studio-panel="">
      {nodes.length === 0
        ? <div className={css.emptyState}>{emptyText}</div>
        : (
          <ReactFlow
            key={version}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
            minZoom={0.25}
            maxZoom={1.6}
            nodesConnectable={false}
            onNodeClick={(_, node) => { actions.selectNode(node.id === selectedNodeId ? null : node.id) }}
            onPaneClick={() => { actions.selectNode(null) }}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={(event) => {
              event.preventDefault()
              const block = event.dataTransfer.getData('text/plain')
              if (block.trim() !== '') actions.addRow(block)
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      <div className={css.legend} aria-hidden="true">
        <span className={css.legendItem}><span className={`${css.legendLine} ${css.legendData}`} />{legend.data}</span>
        <span className={css.legendItem}><span className={`${css.legendLine} ${css.legendLifecycle}`} />{legend.lifecycle}</span>
        <span className={css.legendItem}><span className={`${css.legendLine} ${css.legendService}`} />{legend.service}</span>
      </div>
    </div>
  )
}
