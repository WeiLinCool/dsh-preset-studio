/**
 * Schema-form model tests: JSON Schema properties become editable fields.
 */
import { describe, expect, it } from 'vitest'
import { registryEntry } from '../src/core/registry.ts'
import { exampleConfig, fieldsFromSchema } from '../src/core/schema-form.ts'

describe('fieldsFromSchema', () => {
  it('turns a ranged number into a slider', () => {
    const schema = registryEntry('@deepseek-ai/dsh-tool-web')!.configSchema!
    const fields = fieldsFromSchema(schema)
    const timeout = fields.find(field => field.key === 'searchTimeoutMs')!
    expect(timeout.kind).toBe('slider')
    expect(timeout.min).toBe(1000)
    expect(timeout.max).toBe(300000)
  })

  it('turns a boolean into a checkbox', () => {
    const schema = registryEntry('@deepseek-ai/dsh-tool-fs-search')!.configSchema!
    const fields = fieldsFromSchema(schema)
    expect(fields[0].key).toBe('sampleOverCapGlobResults')
    expect(fields[0].kind).toBe('boolean')
  })

  it('flattens text and number fields', () => {
    const schema = registryEntry('@deepseek-ai/dsh-agent-instructions')!.configSchema!
    const fields = fieldsFromSchema(schema)
    expect(fields).toHaveLength(1)
    expect(fields[0].key).toBe('maxBytes')
    expect(fields[0].kind).toBe('slider')
  })

  it('answers no fields for an unregistered schema', () => {
    expect(fieldsFromSchema(undefined)).toEqual([])
  })
})

describe('exampleConfig', () => {
  it('collects schema defaults only', () => {
    const schema = registryEntry('@deepseek-ai/dsh-tool-web')!.configSchema!
    expect(exampleConfig(schema)).toEqual({ fetch: true, searchTimeoutMs: 60000 })
  })
})
