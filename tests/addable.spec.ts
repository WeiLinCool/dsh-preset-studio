/**
 * Addable-entry tests: registry plus installed-inventory projection, the
 * add-menu filter clauses, and the related-kind ranking used by the canvas
 * add-node context menu.
 */
import { describe, expect, it } from 'vitest'
import type { CapabilityKind } from '../src/core/types.ts'
import { addableEntries, filterAddableEntries, groupAddableEntries, relatedKindOrder } from '../src/client/addable.ts'

const KIND_LABELS: Readonly<Record<CapabilityKind, string>> = {
  model: 'Model',
  loop: 'Agent Loop',
  memory: 'Memory',
  tool: 'Tool',
  skill: 'Skill',
  storage: 'Storage',
  persona: 'Persona',
  group: 'Group',
  other: 'Other',
}

describe('addableEntries', () => {
  it('projects the registry first, then unregistered installed plugins', () => {
    const entries = addableEntries([{ entryId: 'x', moduleName: 'acme-tool', enabled: true, fiberPhase: 'active' }])
    const known = entries.filter(entry => entry.known)
    const installed = entries.filter(entry => !entry.known)
    expect(known.length).toBeGreaterThan(0)
    expect(installed).toHaveLength(1)
    expect(installed[0].module).toBe('acme-tool')
    expect(installed[0].kind).toBe('tool')
    expect(installed[0].template).toContain("name: 'acme-tool'")
  })
})

describe('groupAddableEntries', () => {
  it('groups entries by capability kind preserving first-seen order', () => {
    const grouped = groupAddableEntries(addableEntries([]))
    const tools = grouped.get('tool') ?? []
    expect(tools.length).toBeGreaterThan(0)
    expect(grouped.get('memory')?.length).toBeGreaterThan(0)
  })
})

describe('filterAddableEntries', () => {
  const entries = addableEntries([])

  it('filters by category', () => {
    const tools = filterAddableEntries(entries, '', 'tool', KIND_LABELS)
    expect(tools.length).toBeGreaterThan(0)
    expect(tools.every(entry => entry.kind === 'tool')).toBe(true)
  })

  it('filters by free text across label / module / description', () => {
    const bash = filterAddableEntries(entries, 'bash', null, KIND_LABELS)
    expect(bash.some(entry => entry.module === '@deepseek-ai/dsh-tool-bash')).toBe(true)
    const none = filterAddableEntries(entries, 'definitely-not-here', null, KIND_LABELS)
    expect(none).toHaveLength(0)
  })

  it('combines category and text clauses', () => {
    const combined = filterAddableEntries(entries, 'bash', 'memory', KIND_LABELS)
    expect(combined).toHaveLength(0)
  })
})

describe('relatedKindOrder', () => {
  it('ranks commonly-related kinds before the rest', () => {
    const order = relatedKindOrder('tool', ['tool', 'memory', 'skill', 'model'])
    expect(order.slice(0, 3)).toEqual(['tool', 'memory', 'skill'])
    expect(order[3]).toBe('model')
  })

  it('only includes kinds that are actually available', () => {
    const order = relatedKindOrder('group', ['memory', 'tool'])
    expect(order).toEqual(['memory', 'tool'])
  })
})
