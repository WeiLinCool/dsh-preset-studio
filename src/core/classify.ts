/**
 * Capability classification: which Runtime Capability category one plugin row
 * belongs to, from its module specifier. Pure heuristics over the module
 * name — the bundled registry's explicit entries win over this fold.
 * @module @weilin-cool/dsh-preset-studio/src/core/classify
 */

import type { CapabilityKind } from './types.ts'

/** Rules checked in order; the first match decides. */
const RULES: ReadonlyArray<readonly [RegExp, CapabilityKind]> = [
  [/^cordis:group$/, 'group'],
  [/^cordis:isolate$/, 'group'],
  [/^cordis:.*$/, 'other'],
  [/persona/, 'persona'],
  [/agent-instructions/, 'persona'],
  [/system-prompt/, 'persona'],
  [/-(?:model|llm)(?:-|$)|^dsh-model|llm(?:\/|$)/, 'model'],
  [/agent-loop|^loop(?:\/|$)/, 'loop'],
  [/memory/, 'memory'],
  [/compaction/, 'memory'],
  [/-skill(?:-|$)|^dsh-skill/, 'skill'],
  [/-tool(?:-|$)|^dsh-tool|^tool-/, 'tool'],
  [/(?:-|^)storage(?:-|$)|sqlite|leveldb/, 'storage'],
]

/**
 * Classify one module specifier.
 * @param moduleName - the row's module specifier; anything non-string is `other`.
 * @returns the capability kind.
 */
export function classifyModule(moduleName: string | undefined): CapabilityKind {
  if (moduleName === undefined || moduleName.trim() === '') return 'other'
  for (const [pattern, kind] of RULES) {
    if (pattern.test(moduleName)) return kind
  }
  return 'other'
}
