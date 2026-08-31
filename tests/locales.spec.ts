/**
 * Locale parity tests: every zh key has an en counterpart and vice versa.
 */
import { describe, expect, it } from 'vitest'
import { en, zh } from '../src/client/locales.ts'

describe('locales', () => {
  it('keeps zh and en key sets identical', () => {
    const zhKeys = Object.keys(zh).sort()
    const enKeys = Object.keys(en).sort()
    expect(zhKeys).toEqual(enKeys)
  })

  it('has no empty copy', () => {
    for (const [key, value] of Object.entries(zh)) {
      expect(value.trim(), key).not.toBe('')
    }
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), key).not.toBe('')
    }
  })
})
