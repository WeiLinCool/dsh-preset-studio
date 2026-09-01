/**
 * Positioned insert tests: inserting after a row lands at that row's scope,
 * and group-member inserts nest inside the group.
 */
import { describe, expect, it } from 'vitest'
import { MINI_COMPOSITION } from './fixtures.ts'
import { insertGroupMember, insertRowAfter } from '../src/core/edit.ts'
import { flattenRows, parseComposition } from '../src/core/yaml.ts'

describe('insertRowAfter', () => {
  it('inserts a top-level row right after the anchor row', () => {
    const next = insertRowAfter(MINI_COMPOSITION, [2], `- id: tool-todo\n  name: '@deepseek-ai/dsh-tool-todo'\n`)
    expect(next).not.toBeNull()
    const parsed = parseComposition(next!)
    expect(parsed.rows).not.toBeNull()
    const rows = flattenRows(parsed.rows!)
    const ids = rows.map(row => row.id)
    expect(ids.indexOf('tool-todo')).toBe(ids.indexOf('tool-bash') + 1)
    expect(ids.indexOf('tool-todo')).toBeLessThan(ids.indexOf('tool-web'))
  })

  it('inserts a nested row as a sibling inside the same group', () => {
    const next = insertRowAfter(MINI_COMPOSITION, [5, 1], `- id: tool-todo\n  name: '@deepseek-ai/dsh-tool-todo'\n`)
    expect(next).not.toBeNull()
    const parsed = parseComposition(next!)
    const group = parsed.rows![5]
    expect(group.group).toBe(true)
    const children = group.children.map(row => row.id)
    expect(children).toEqual(['compaction-basic', 'tool-result-pruner', 'tool-todo'])
    // Top-level row count is unchanged.
    expect(parsed.rows).toHaveLength(7)
  })

  it('answers null for an out-of-bounds path', () => {
    expect(insertRowAfter(MINI_COMPOSITION, [99], `- id: x\n  name: y\n`)).toBeNull()
  })
})

describe('insertGroupMember', () => {
  it('appends a member inside a group', () => {
    const next = insertGroupMember(MINI_COMPOSITION, [5], `- id: tool-fs\n  name: '@deepseek-ai/dsh-tool-fs'\n`)
    expect(next).not.toBeNull()
    const parsed = parseComposition(next!)
    const group = parsed.rows![5]
    expect(group.children.map(row => row.id)).toContain('tool-fs')
    expect(group.children.at(-1)?.id).toBe('tool-fs')
  })

  it('answers null when the anchor is not a group with members', () => {
    expect(insertGroupMember(MINI_COMPOSITION, [0], `- id: tool-fs\n  name: '@deepseek-ai/dsh-tool-fs'\n`)).toBeNull()
  })

  it('keeps the sibling row after the group intact', () => {
    const next = insertGroupMember(MINI_COMPOSITION, [5], `- id: tool-fs\n  name: '@deepseek-ai/dsh-tool-fs'\n`)
    const parsed = parseComposition(next!)
    // Top-level order: the next row after the compaction group is delegation.
    const topIds = parsed.rows!.map(row => row.id)
    expect(topIds).toEqual(['persona', 'agent-instructions', 'tool-bash', 'tool-web', 'planning', 'compaction', 'delegation'])
  })
})
