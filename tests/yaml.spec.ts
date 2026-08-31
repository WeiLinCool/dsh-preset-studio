/**
 * Composition parsing tests: rows, group nesting, `!!js` expressions, and
 * root-shape problems.
 */
import { describe, expect, it } from 'vitest'
import { CONDITIONAL_COMPOSITION, MINI_COMPOSITION, NOT_A_LIST } from './fixtures.ts'
import { flattenRows, isJsExpression, nodeId, parseComposition } from '../src/core/yaml.ts'

describe('parseComposition', () => {
  it('parses a composition into top-level rows', () => {
    const parsed = parseComposition(MINI_COMPOSITION)
    expect(parsed.problem).toBeUndefined()
    expect(parsed.rows).not.toBeNull()
    expect(parsed.rows!.length).toBe(7)
    expect(parsed.rows![0].id).toBe('persona')
    expect(parsed.rows![0].name).toBe('@deepseek-ai/dsh-persona')
    expect(parsed.rows![0].group).toBe(false)
  })

  it('nests group members under cordis:group rows', () => {
    const parsed = parseComposition(MINI_COMPOSITION)
    const planning = parsed.rows![4]
    expect(planning.group).toBe(true)
    expect(planning.children).toHaveLength(1)
    expect(planning.children[0].index).toEqual([4, 0])
    expect(planning.children[0].name).toBe('@deepseek-ai/dsh-plan-mode')
    const compaction = parsed.rows![5]
    expect(compaction.children).toHaveLength(2)
    expect(compaction.children[1].index).toEqual([5, 1])
  })

  it('keeps !!js disabled expressions as markers, not strings', () => {
    const parsed = parseComposition(CONDITIONAL_COMPOSITION)
    const row = parsed.rows![0]
    expect(isJsExpression(row.disabled)).toBe(true)
  })

  it('flattens rows in document order with stable node ids', () => {
    const parsed = parseComposition(MINI_COMPOSITION)
    const flat = flattenRows(parsed.rows!)
    expect(flat.map(row => nodeId(row.index))).toEqual([
      'r0', 'r1', 'r2', 'r3', 'r4', 'r4.0', 'r5', 'r5.0', 'r5.1', 'r6', 'r6.0', 'r6.1',
    ])
  })

  it('reports a non-list root as a problem', () => {
    const parsed = parseComposition(NOT_A_LIST)
    expect(parsed.rows).toBeNull()
    expect(parsed.problem).toContain('顶层')
  })

  it('reports a YAML syntax error as a problem', () => {
    const parsed = parseComposition('- id: a\n  name: [unclosed\n')
    expect(parsed.rows).toBeNull()
    expect(parsed.problem).toBeDefined()
  })
})
