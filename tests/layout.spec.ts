/**
 * Layout tests: every node lands on finite coordinates and children rank
 * below their parents.
 */
import { describe, expect, it } from 'vitest'
import { MINI_COMPOSITION } from './fixtures.ts'
import { buildGraph } from '../src/core/graph.ts'
import { layoutGraph } from '../src/core/layout.ts'
import { parseComposition } from '../src/core/yaml.ts'

describe('layoutGraph', () => {
  it('positions every node with finite top-left coordinates', () => {
    const parsed = parseComposition(MINI_COMPOSITION)
    const graph = buildGraph(parsed.rows!)
    const positions = layoutGraph(graph.nodes, graph.edges)
    expect(positions.size).toBe(graph.nodes.length)
    for (const point of positions.values()) {
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
    }
  })

  it('lays group members below their group', () => {
    const parsed = parseComposition(MINI_COMPOSITION)
    const graph = buildGraph(parsed.rows!)
    const positions = layoutGraph(graph.nodes, graph.edges)
    for (const edge of graph.edges.filter(candidate => candidate.type === 'lifecycle')) {
      const parent = positions.get(edge.source)
      const child = positions.get(edge.target)
      expect(parent).toBeDefined()
      expect(child).toBeDefined()
      expect(child!.y).toBeGreaterThan(parent!.y)
    }
  })
})
