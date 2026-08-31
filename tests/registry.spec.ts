/**
 * Registry tests: entries are complete, unique, and their templates parse.
 */
import { describe, expect, it } from 'vitest'
import { REGISTRY, registryEntry } from '../src/core/registry.ts'
import { parseComposition } from '../src/core/yaml.ts'

describe('REGISTRY', () => {
  it('has unique module specifiers', () => {
    const modules = REGISTRY.map(entry => entry.module)
    expect(new Set(modules).size).toBe(modules.length)
  })

  it('every template parses as exactly one row with a name', () => {
    for (const entry of REGISTRY) {
      const parsed = parseComposition(entry.template)
      expect(parsed.problem, entry.module).toBeUndefined()
      expect(parsed.rows, entry.module).toHaveLength(1)
      expect(parsed.rows![0].name, entry.module).toBe(entry.module)
    }
  })

  it('declares schemas only for fields the studio can render', () => {
    for (const entry of REGISTRY) {
      if (entry.configSchema === undefined) continue
      for (const property of Object.values(entry.configSchema.properties ?? {})) {
        expect(['string', 'number', 'integer', 'boolean', 'array', 'object']).toContain(property.type)
      }
    }
  })

  it('resolves the shipped rows', () => {
    expect(registryEntry('@deepseek-ai/dsh-tool-web')?.kind).toBe('tool')
    expect(registryEntry('@deepseek-ai/dsh-persona')?.kind).toBe('persona')
    expect(registryEntry('not-registered')).toBeUndefined()
  })
})
