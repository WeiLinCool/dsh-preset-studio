/**
 * Row surgery tests: line ranges, config edits with `!!js` round-trips, row
 * removal, and palette appends.
 */
import { describe, expect, it } from 'vitest'
import { CONDITIONAL_COMPOSITION, MINI_COMPOSITION } from './fixtures.ts'
import { appendRow, editRowConfig, removeRow, rowLineRange } from '../src/core/edit.ts'
import { flattenRows, isJsExpression, parseComposition } from '../src/core/yaml.ts'

describe('rowLineRange', () => {
  it('locates top-level rows', () => {
    const range = rowLineRange(MINI_COMPOSITION, [3])
    expect(range).not.toBeNull()
    const lines = MINI_COMPOSITION.split('\n')
    expect(lines[range!.start]).toContain('id: tool-web')
    const slice = lines.slice(range!.start, range!.end).join('\n')
    expect(slice).toContain('searchTimeoutMs')
    expect(slice).not.toContain('id: planning')
  })

  it('locates nested rows inside groups', () => {
    const range = rowLineRange(MINI_COMPOSITION, [5, 1])
    expect(range).not.toBeNull()
    const lines = MINI_COMPOSITION.split('\n')
    expect(lines[range!.start]).toContain('id: tool-result-pruner')
  })

  it('answers null for out-of-bounds paths', () => {
    expect(rowLineRange(MINI_COMPOSITION, [99])).toBeNull()
    expect(rowLineRange(MINI_COMPOSITION, [4, 99])).toBeNull()
  })
})

describe('editRowConfig', () => {
  it('edits one config field and leaves the rest of the file intact', () => {
    const next = editRowConfig(MINI_COMPOSITION, [3], 'searchTimeoutMs', 120000)
    expect(next).not.toBeNull()
    expect(next).toContain('searchTimeoutMs: 120000')
    // Comments and untouched rows survive.
    expect(next).toContain('# Miniature agent composition (test fixture)')
    expect(next).toContain('id: persona')
    const parsed = parseComposition(next!)
    expect(parsed.rows).not.toBeNull()
  })

  it('round-trips !!js disabled expressions when editing a sibling field', () => {
    const next = editRowConfig(CONDITIONAL_COMPOSITION, [0], 'config.flag', true)
    expect(next).not.toBeNull()
    expect(next).toContain('disabled: !!js process.platform')
    const parsed = parseComposition(next!)
    expect(isJsExpression(parsed.rows![0].disabled)).toBe(true)
  })

  it('answers null when the draft does not parse', () => {
    expect(editRowConfig('not: a: list', [0], 'a', 1)).toBeNull()
  })
})

describe('removeRow', () => {
  it('removes only the targeted row', () => {
    const next = removeRow(MINI_COMPOSITION, [3])
    expect(next).not.toBeNull()
    expect(next).not.toContain('id: tool-web')
    expect(next).toContain('id: tool-bash')
    expect(next).toContain('id: planning')
    const parsed = parseComposition(next!)
    expect(flattenRows(parsed.rows!).some(row => row.id === 'tool-web')).toBe(false)
  })
})

describe('appendRow', () => {
  it('appends a registry template to the draft', () => {
    const next = appendRow(MINI_COMPOSITION, `- id: tool-todo\n  name: '@deepseek-ai/dsh-tool-todo'\n`)
    const parsed = parseComposition(next)
    expect(parsed.rows).not.toBeNull()
    expect(parsed.rows!.at(-1)?.id).toBe('tool-todo')
  })
})
