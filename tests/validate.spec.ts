/**
 * Validation tests: parseable/clean verdicts and row-level diagnostics.
 */
import { describe, expect, it } from 'vitest'
import { MINI_COMPOSITION, NOT_A_LIST, PROBLEM_COMPOSITION } from './fixtures.ts'
import { validateComposition } from '../src/core/validate.ts'

describe('validateComposition', () => {
  it('validates the miniature composition as clean', () => {
    const result = validateComposition(MINI_COMPOSITION)
    expect(result.parseable).toBe(true)
    expect(result.diagnostics).toHaveLength(0)
  })

  it('reports an unparseable root', () => {
    const result = validateComposition(NOT_A_LIST)
    expect(result.parseable).toBe(false)
    expect(result.problem).toBeDefined()
  })

  it('warns about unknown modules without failing the composition', () => {
    const result = validateComposition(PROBLEM_COMPOSITION)
    const unknown = result.diagnostics.find(item => item.message.includes('内置注册表'))
    expect(unknown?.severity).toBe('warning')
  })

  it('reports missing names as errors with the row index', () => {
    const result = validateComposition(PROBLEM_COMPOSITION)
    const nameless = result.diagnostics.find(item => item.message.includes('缺少 name'))
    expect(nameless?.severity).toBe('error')
    expect(nameless?.index).toBe('r2')
  })

  it('warns about empty groups', () => {
    const result = validateComposition(`- id: empty\n  name: cordis:group\n`)
    expect(result.diagnostics.some(item => item.message.includes('空组合组'))).toBe(true)
  })
})
