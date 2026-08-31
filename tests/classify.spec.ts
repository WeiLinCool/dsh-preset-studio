/**
 * Classification tests: module specifiers map onto the right capability kind.
 */
import { describe, expect, it } from 'vitest'
import { classifyModule } from '../src/core/classify.ts'

describe('classifyModule', () => {
  it('classifies the shipped preset rows', () => {
    expect(classifyModule('@deepseek-ai/dsh-persona')).toBe('persona')
    expect(classifyModule('@deepseek-ai/dsh-agent-instructions')).toBe('persona')
    expect(classifyModule('@deepseek-ai/dsh-tool-bash')).toBe('tool')
    expect(classifyModule('@deepseek-ai/dsh-tool-web')).toBe('tool')
    expect(classifyModule('@deepseek-ai/dsh-tool-subagent')).toBe('tool')
    expect(classifyModule('@deepseek-ai/dsh-skill-filesystem')).toBe('skill')
    expect(classifyModule('@deepseek-ai/dsh-compaction-basic')).toBe('memory')
    expect(classifyModule('cordis:group')).toBe('group')
  })

  it('falls back to other for unknown or missing names', () => {
    expect(classifyModule('acme-custom-plugin')).toBe('other')
    expect(classifyModule(undefined)).toBe('other')
    expect(classifyModule('')).toBe('other')
  })
})
