/**
 * Diff tests: line diff and row-set diff over composition texts.
 */
import { describe, expect, it } from 'vitest'
import { CONDITIONAL_COMPOSITION, MINI_COMPOSITION } from './fixtures.ts'
import { diffLines, diffRows, diffTotals } from '../src/core/diff.ts'

describe('diffLines', () => {
  it('reports a pure addition', () => {
    const lines = diffLines('a\n', 'a\nb\n')
    expect(lines.map(line => line.kind)).toEqual(['same', 'add', 'same'])
    expect(diffTotals(lines)).toEqual({ added: 1, removed: 0 })
  })

  it('reports a replacement', () => {
    const lines = diffLines('a\nb\n', 'a\nc\n')
    expect(lines.map(line => line.kind)).toEqual(['same', 'add', 'del', 'same'])
  })
})

describe('diffRows', () => {
  it('detects an appended tool row', () => {
    const after = `${MINI_COMPOSITION}- id: tool-todo\n  name: '@deepseek-ai/dsh-tool-todo'\n`
    const diff = diffRows(MINI_COMPOSITION, after)
    expect(diff).not.toBeNull()
    expect(diff!.added.map(row => row.moduleName)).toEqual(['@deepseek-ai/dsh-tool-todo'])
    expect(diff!.removed).toEqual([])
  })

  it('detects a removed row and keeps the unchanged pool', () => {
    const before = MINI_COMPOSITION
    const after = before.replace("- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  config:\n    fetch: true\n    searchTimeoutMs: 60000\n\n", '')
    const diff = diffRows(before, after)
    expect(diff).not.toBeNull()
    expect(diff!.removed.map(row => row.id)).toContain('tool-web')
    expect(diff!.unchanged.some(row => row.id === 'persona')).toBe(true)
  })

  it('answers null when either side does not parse', () => {
    expect(diffRows('not: a: list', MINI_COMPOSITION)).toBeNull()
  })

  it('treats conditional rows on both sides as unchanged', () => {
    const diff = diffRows(CONDITIONAL_COMPOSITION, CONDITIONAL_COMPOSITION)
    expect(diff).not.toBeNull()
    expect(diff!.unchanged).toHaveLength(2)
  })
})
