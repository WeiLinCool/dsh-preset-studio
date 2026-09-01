/**
 * Composition validation: one walk over the document, reporting everything
 * that would keep the loader from mounting the composition or that reads as a
 * mistake. The parse/root problems come from {@link parseComposition}; this
 * module adds the row-level checks.
 * @module @weilin-cool/dsh-preset-studio/src/core/validate
 */

import { buildGraph } from './graph.ts'
import { registryEntry } from './registry.ts'
import type { CompositionDiagnostic } from './types.ts'
import { flattenRows, parseComposition } from './yaml.ts'

/** Everything validation knows about one composition text. */
export interface ValidationResult {
  /** Whether the document parses as a top-level row list at all. */
  readonly parseable: boolean
  /** The parse/root problem, when the document is not parseable. */
  readonly problem?: string
  /** Row-level problems; empty when the composition is clean. */
  readonly diagnostics: readonly CompositionDiagnostic[]
}

/** A module specifier that reads as a loadable package / cordis entry. */
const MODULE_SHAPE = /^(?:@[a-z0-9-]+\/)?[a-z0-9-]+(?:\/[a-z0-9-./]+)*$|^(?:cordis|plugin|link|github|file):.+/

/**
 * Validate one composition text.
 * @param text - the composition exactly as the user edited it.
 * @returns parse state plus every row-level diagnostic.
 */
export function validateComposition(text: string): ValidationResult {
  const parsed = parseComposition(text)
  if (parsed.rows === null) {
    return { parseable: false, problem: parsed.problem, diagnostics: [] }
  }
  const graph = buildGraph(parsed.rows)
  const diagnostics: CompositionDiagnostic[] = [...graph.diagnostics]

  for (const row of flattenRows(parsed.rows)) {
    const index = `r${row.index.join('.')}`
    if (row.name !== undefined && !MODULE_SHAPE.test(row.name)) {
      diagnostics.push({
        severity: 'warning',
        message: `模块名 "${row.name}" 不像可解析的包名或 cordis 入口`,
        index,
      })
    }
    if (row.name !== undefined && registryEntry(row.name) === undefined) {
      diagnostics.push({
        severity: 'warning',
        message: `模块 "${row.name}" 不在内置注册表中：无配置表单与 service 边（不影响加载）`,
        index,
      })
    }
    if (row.group && row.children.length === 0) {
      diagnostics.push({
        severity: 'warning',
        message: '空组合组：该 group 不含任何子行',
        index,
      })
    }
  }
  return { parseable: true, diagnostics }
}
