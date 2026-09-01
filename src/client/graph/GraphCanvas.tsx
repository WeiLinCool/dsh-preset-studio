/**
 * The Harness Graph canvas: dagre-laid-out composition DAG on ReactFlow, with
 * a bottom toolbar (category highlight / locate and node search), the
 * edge-type legend, and the add-node context menu.
 *
 * Adding nodes happens in-canvas: right-click a node, or click the ＋ on a
 * selected node, to insert a related component by capability category. The
 * left rail is presets only — component discovery lives here.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background, BackgroundVariant, Controls, Panel, ReactFlow,
  type Edge, type Node, type ReactFlowInstance,
} from '@xyflow/react'
import { layoutGraph } from '../../core/layout.ts'
import type { CapabilityKind, HarnessGraph } from '../../core/types.ts'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { PresetStudioKey } from '../locales.ts'
import type { PluginInventoryEntry } from '../wire.ts'
import type { AddableEntry } from '../addable.ts'
import css from '../presetstudio.module.css'
import { HarnessEdgeView, type HarnessEdgeData } from './HarnessEdge.tsx'
import { HarnessNodeView, KIND_CLASS, shortModule, type HarnessNodeData } from './HarnessNode.tsx'
import { NodeContextMenu, type AddMode } from './NodeContextMenu.tsx'

export interface GraphCanvasActions {
  selectNode: (id: string | null) => void
  addRow: (block: string) => void
  /** Insert a row right after the anchor node, at the anchor's scope. */
  addRowAfter: (nodeId: string, block: string) => void
  /** Insert a row as the last member of a group anchor. */
  addRowToGroup: (nodeId: string, block: string) => void
}

interface GraphCanvasProps {
  graph: HarnessGraph
  selectedNodeId: string | null
  /** Remount key: changes when the draft changes, so layouts stay fresh. */
  version: string
  actions: GraphCanvasActions
  /** Installed plugin inventory (unregistered rows appear in the menu). */
  inventoryEntries: readonly PluginInventoryEntry[]
  emptyText: string
  legend: { data: string; lifecycle: string; service: string }
  /** Display labels for every capability kind (toolbar chips). */
  kindLabels: Readonly<Record<CapabilityKind, string>>
  /** Search input placeholder. */
  searchPlaceholder: string
  /** Toolbar aria label. */
  toolbarLabel: string
  /** Clear-filters button aria label. */
  clearLabel: string
  /** Add-related-node button / menu copy. */
  addRelatedLabel: string
  /** Full locale seat for the context menu. */
  t: Translate<PresetStudioKey>
}

/** The canvas node types (stable identity — ReactFlow re-creates on change). */
const nodeTypes = { harness: HarnessNodeView }
const edgeTypes = { harness: HarnessEdgeView }

/** Every capability kind, in the toolbar's display order. */
const KINDS: readonly CapabilityKind[] = [
  'model', 'loop', 'memory', 'tool', 'skill', 'storage', 'persona', 'group', 'other',
]

/** One open add-node menu: null anchor appends to the composition end. */
interface MenuState {
  nodeId: string | null
  x: number
  y: number
}

/** The searchable text of one node: id, row id, module (short and full), and kind label. */
function nodeSearchText(node: HarnessGraph['nodes'][number], kindLabels: Readonly<Record<CapabilityKind, string>>): string {
  return [
    node.id,
    node.rowId ?? '',
    shortModule(node.moduleName),
    node.moduleName ?? '',
    node.kind,
    kindLabels[node.kind] ?? '',
  ].join(' ').toLowerCase()
}

/** Matching node ids under a query + category filter (empty query/set disables that clause). */
function computeMatchIds(
  graph: HarnessGraph,
  queryLower: string,
  activeKinds: ReadonlySet<CapabilityKind>,
  kindLabels: Readonly<Record<CapabilityKind, string>>,
): string[] {
  const kindActive = activeKinds.size > 0
  return graph.nodes
    .filter((node) => {
      const kindOk = !kindActive || activeKinds.has(node.kind)
      const queryOk = queryLower === '' || nodeSearchText(node, kindLabels).includes(queryLower)
      return kindOk && queryOk
    })
    .map(node => node.id)
}

/**
 * Render the graph canvas.
 * @param props - the graph, selection, remount key, actions, and copy.
 * @returns the ReactFlow canvas with its bottom toolbar and add-node menu.
 */
export function GraphCanvas({
  graph, selectedNodeId, version, actions, inventoryEntries, emptyText, legend, kindLabels,
  searchPlaceholder, toolbarLabel, clearLabel, addRelatedLabel, t,
}: GraphCanvasProps) {
  const laid = useMemo(() => layoutGraph(graph.nodes, graph.edges), [graph])
  const rfRef = useRef<ReactFlowInstance | null>(null)

  // Canvas-local toolbar state: free text search plus active category chips.
  const [query, setQuery] = useState('')
  const [activeKinds, setActiveKinds] = useState<ReadonlySet<CapabilityKind>>(new Set())
  const [matchCursor, setMatchCursor] = useState(0)

  // The open add-node context menu (anchor node id, or null to append).
  const [menu, setMenu] = useState<MenuState | null>(null)

  const queryLower = query.trim().toLowerCase()
  const kindActive = activeKinds.size > 0
  const filterActive = queryLower !== '' || kindActive

  // Close the add menu when the draft changes (nodes remount anyway).
  useEffect(() => { setMenu(null) }, [version])

  /** Matching node ids under the current query + category filter, or null when no filter is active. */
  const matchIds = useMemo<string[] | null>(() => {
    if (!filterActive) return null
    return computeMatchIds(graph, queryLower, activeKinds, kindLabels)
  }, [graph, filterActive, queryLower, activeKinds, kindLabels])
  const matchedSet = useMemo(() => new Set(matchIds ?? []), [matchIds])
  const matchCount = matchIds?.length ?? 0
  const safeCursor = matchCount === 0 ? 0 : Math.min(matchCursor, matchCount - 1)

  /** Ids of nodes directly connected to the current selection (dependency neighbors). */
  const relatedIds = useMemo(() => {
    if (selectedNodeId === null) return new Set<string>()
    const set = new Set<string>()
    for (const edge of graph.edges) {
      if (edge.source === selectedNodeId) set.add(edge.target)
      else if (edge.target === selectedNodeId) set.add(edge.source)
    }
    return set
  }, [selectedNodeId, graph.edges])

  /** Modules already present in the composition (disabled in the add menu). */
  const existingModules = useMemo(() => new Set(
    graph.nodes.map(node => node.moduleName).filter((name): name is string => name !== undefined),
  ), [graph])

  const openNodeMenu = useCallback((nodeId: string, event: { clientX: number; clientY: number }): void => {
    actions.selectNode(nodeId)
    setMenu({ nodeId, x: event.clientX, y: event.clientY })
  }, [actions])

  const openAppendMenu = useCallback((event: { clientX: number; clientY: number }): void => {
    setMenu({ nodeId: null, x: event.clientX, y: event.clientY })
  }, [])

  const closeMenu = useCallback((): void => { setMenu(null) }, [])

  const handlePick = useCallback((entry: AddableEntry, mode: AddMode): void => {
    const current = menu
    setMenu(null)
    if (current === null) return
    if (current.nodeId === null) actions.addRow(entry.template)
    else if (mode === 'group') actions.addRowToGroup(current.nodeId, entry.template)
    else actions.addRowAfter(current.nodeId, entry.template)
  }, [menu, actions])

  const menuAnchor = useMemo(() => {
    if (menu === null || menu.nodeId === null) return null
    return graph.nodes.find(node => node.id === menu.nodeId) ?? null
  }, [menu, graph])

  const nodes = useMemo<Node[]>(() => graph.nodes.map((node) => {
    const matched = matchIds !== null && matchedSet.has(node.id)
    return {
      id: node.id,
      type: 'harness',
      position: laid.get(node.id) ?? { x: 0, y: 0 },
      data: {
        node,
        matched,
        dimmed: filterActive && !matched && !relatedIds.has(node.id),
        related: relatedIds.has(node.id),
        onAddRelated: (event) => { openNodeMenu(node.id, event) },
        addRelatedLabel,
      } satisfies HarnessNodeData,
      draggable: true,
      selected: selectedNodeId === node.id,
    }
  }), [graph, laid, matchIds, matchedSet, filterActive, relatedIds, selectedNodeId, openNodeMenu, addRelatedLabel])
  const nodeById = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes])

  const dimmedById = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const node of nodes) {
      const data = node.data as unknown as HarnessNodeData
      map.set(node.id, data.dimmed === true)
    }
    return map
  }, [nodes])
  const edges = useMemo<Edge[]>(() => graph.edges.map((edge) => {
    const active = selectedNodeId !== null
      && (edge.source === selectedNodeId || edge.target === selectedNodeId)
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'harness',
      data: {
        edgeType: edge.type,
        dimmed: (dimmedById.get(edge.source) ?? false) || (dimmedById.get(edge.target) ?? false),
        active,
      } satisfies HarnessEdgeData,
    }
  }), [graph, dimmedById, selectedNodeId])

  const fitToIds = useCallback((ids: readonly string[]): void => {
    const instance = rfRef.current
    if (instance === null || ids.length === 0) return
    const targets = ids.map(id => nodeById.get(id)).filter((node): node is Node => node !== undefined)
    void instance.fitView({ nodes: targets, padding: 0.25, duration: 300, maxZoom: 1.1 })
  }, [nodeById])

  const fitAll = useCallback((): void => {
    void rfRef.current?.fitView({ padding: 0.2, duration: 300, maxZoom: 1.1 })
  }, [])

  /** Locate the first match: center/zoom to it and open it in the inspector. */
  const locateFirst = useCallback((ids: readonly string[]): void => {
    if (ids.length === 0) return
    setMatchCursor(0)
    fitToIds([ids[0]])
    actions.selectNode(ids[0])
  }, [fitToIds, actions])

  const goToMatch = useCallback((index: number): void => {
    if (matchIds === null || matchIds.length === 0) return
    const next = ((index % matchIds.length) + matchIds.length) % matchIds.length
    setMatchCursor(next)
    fitToIds([matchIds[next]])
    actions.selectNode(matchIds[next])
  }, [matchIds, fitToIds, actions])

  const toggleKind = useCallback((kind: CapabilityKind): void => {
    // Single-select: clicking a chip locates exactly that capability kind;
    // clicking the active chip clears the category filter.
    const next = new Set<CapabilityKind>()
    if (!activeKinds.has(kind)) next.add(kind)
    setActiveKinds(next)
    setMatchCursor(0)
    const ids = next.size === 0 ? [] : graph.nodes.filter(node => next.has(node.kind)).map(node => node.id)
    if (ids.length === 0) fitAll()
    else locateFirst(ids)
  }, [activeKinds, graph, fitAll, locateFirst])

  const clearFilters = useCallback((): void => {
    setQuery('')
    setActiveKinds(new Set())
    setMatchCursor(0)
    fitAll()
  }, [fitAll])

  return (
    <div className={css.canvas} data-dsh-preset-studio-panel="">
      {nodes.length === 0
        ? (
          <div className={css.emptyState}>
            <p>{emptyText}</p>
            <button
              type="button"
              className={css.canvasAddButton}
              onClick={(event) => { openAppendMenu(event) }}
            >
              <span aria-hidden="true">＋</span>
              <span>{addRelatedLabel}</span>
            </button>
          </div>
        )
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
            onInit={(instance) => { rfRef.current = instance }}
            onNodeClick={(_, node) => { actions.selectNode(node.id === selectedNodeId ? null : node.id) }}
            onNodeContextMenu={(event, node) => {
              event.preventDefault()
              openNodeMenu(node.id, event)
            }}
            onPaneClick={() => { setMenu(null); actions.selectNode(null) }}
            onPaneContextMenu={(event) => { event.preventDefault(); setMenu(null) }}
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
            <Controls showInteractive={false} position="top-right" />
            <Panel position="top-left" className={css.canvasAddPanel}>
              <button
                type="button"
                className={css.canvasAddButton}
                onClick={(event) => { openAppendMenu(event) }}
                aria-label={addRelatedLabel}
              >
                <span aria-hidden="true">＋</span>
                <span>{addRelatedLabel}</span>
              </button>
            </Panel>
          </ReactFlow>
        )}

      {menu !== null && (
        <NodeContextMenu
          key={`${menu.nodeId ?? 'append'}:${menu.x}:${menu.y}`}
          anchor={menuAnchor}
          x={menu.x}
          y={menu.y}
          inventoryEntries={inventoryEntries}
          kindLabels={kindLabels}
          existingModules={existingModules}
          t={t}
          onPick={handlePick}
          onClose={closeMenu}
        />
      )}

      {nodes.length > 0 && (
        <div className={css.canvasToolbar} role="toolbar" aria-label={toolbarLabel}>
          <div className={css.toolbarLegend} aria-hidden="true">
            <span className={css.legendItem}><span className={`${css.legendLine} ${css.legendData}`} />{legend.data}</span>
            <span className={css.legendItem}><span className={`${css.legendLine} ${css.legendLifecycle}`} />{legend.lifecycle}</span>
            <span className={css.legendItem}><span className={`${css.legendLine} ${css.legendService}`} />{legend.service}</span>
          </div>

          <div className={css.toolbarKinds}>
            {KINDS.map(kind => (
              <button
                key={kind}
                type="button"
                className={activeKinds.has(kind) ? `${css.toolbarKind} ${css.toolbarKindActive}` : css.toolbarKind}
                aria-pressed={activeKinds.has(kind)}
                title={kindLabels[kind]}
                onClick={() => { toggleKind(kind) }}
              >
                <span className={`${css.kindDot} ${KIND_CLASS[kind] ?? css.kindOther}`} />
                <span>{kindLabels[kind]}</span>
              </button>
            ))}
          </div>

          <div className={css.toolbarSearch}>
            <input
              className={css.toolbarInput}
              type="text"
              value={query}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(event) => {
                const value = event.target.value
                setQuery(value)
                setMatchCursor(0)
                const ql = value.trim().toLowerCase()
                // Only auto-locate when a filter is actually active (query or kind).
                if (ql !== '' || activeKinds.size > 0) {
                  const ids = computeMatchIds(graph, ql, activeKinds, kindLabels)
                  if (ids.length > 0) locateFirst(ids)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && matchCount > 0) goToMatch(safeCursor)
              }}
            />
            {filterActive && (
              <span className={css.toolbarCount} role="status">
                {matchCount === 0 ? '0' : `${safeCursor + 1}/${matchCount}`}
              </span>
            )}
            <button
              type="button"
              className={css.toolbarNav}
              disabled={matchCount < 2}
              aria-label="↑"
              onClick={() => { goToMatch(safeCursor - 1) }}
            >
              ↑
            </button>
            <button
              type="button"
              className={css.toolbarNav}
              disabled={matchCount < 2}
              aria-label="↓"
              onClick={() => { goToMatch(safeCursor + 1) }}
            >
              ↓
            </button>
            {(query !== '' || activeKinds.size > 0) && (
              <button
                type="button"
                className={css.toolbarClear}
                aria-label={clearLabel}
                onClick={clearFilters}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
