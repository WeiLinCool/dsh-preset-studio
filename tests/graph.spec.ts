/**
 * Harness Graph builder tests: node projection, edge derivation
 * (lifecycle / data / service), and structural diagnostics.
 */
import { describe, expect, it } from 'vitest'
import { CONDITIONAL_COMPOSITION, MINI_COMPOSITION, PROBLEM_COMPOSITION } from './fixtures.ts'
import { buildGraph } from '../src/core/graph.ts'
import { parseComposition } from '../src/core/yaml.ts'

function graphOf(text: string) {
  const parsed = parseComposition(text)
  expect(parsed.rows).not.toBeNull()
  return buildGraph(parsed.rows!)
}

describe('buildGraph', () => {
  it('projects every row into a node with its kind and enablement', () => {
    const graph = graphOf(MINI_COMPOSITION)
    expect(graph.nodes).toHaveLength(12)
    const bash = graph.nodes.find(node => node.rowId === 'tool-bash')!
    expect(bash.kind).toBe('tool')
    expect(bash.enabled).toBe(true)
    const planning = graph.nodes.find(node => node.rowId === 'planning')!
    expect(planning.kind).toBe('group')
    expect(planning.hasChildren).toBe(true)
    expect(planning.provides).toEqual([])
  })

  it('derives lifecycle edges from group membership', () => {
    const graph = graphOf(MINI_COMPOSITION)
    const lifecycle = graph.edges.filter(edge => edge.type === 'lifecycle')
    expect(lifecycle).toHaveLength(5) // planning(1) + compaction(2) + delegation(2)
    const toPlanMode = lifecycle.find(edge => edge.target === 'r4.0')
    expect(toPlanMode?.source).toBe('r4')
  })

  it('derives data edges between consecutive siblings', () => {
    const graph = graphOf(MINI_COMPOSITION)
    const data = graph.edges.filter(edge => edge.type === 'data')
    expect(data.some(edge => edge.source === 'r0' && edge.target === 'r1')).toBe(true)
    expect(data.some(edge => edge.source === 'r5.0' && edge.target === 'r5.1')).toBe(true)
    // No data edge across group boundaries.
    expect(data.some(edge => edge.source === 'r4' && edge.target === 'r4.0')).toBe(false)
  })

  it('derives service edges from declarative provides/consumes', () => {
    const graph = graphOf(MINI_COMPOSITION)
    const service = graph.edges.filter(edge => edge.type === 'service')
    // persona → subagent (system-prompt) and persona → workflow, inside the
    // delegation group where the consumers live.
    const subagent = graph.nodes.find(node => node.rowId === 'tool-subagent')!
    const persona = graph.nodes.find(node => node.rowId === 'persona')!
    expect(service.some(edge => edge.source === persona.id && edge.target === subagent.id)).toBe(true)
  })

  it('marks !!js disablement as conditional', () => {
    const graph = graphOf(CONDITIONAL_COMPOSITION)
    for (const node of graph.nodes) {
      expect(node.enabled).toBe('conditional')
      expect(node.condition).toBeDefined()
    }
  })

  it('reports duplicate row ids and nameless rows', () => {
    const graph = graphOf(PROBLEM_COMPOSITION)
    const duplicate = graph.diagnostics.find(item => item.message.includes('重复'))
    expect(duplicate?.severity).toBe('warning')
    const nameless = graph.diagnostics.find(item => item.message.includes('缺少 name'))
    expect(nameless?.severity).toBe('error')
  })
})
