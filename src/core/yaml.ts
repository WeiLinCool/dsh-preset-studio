/**
 * Composition parsing: `agent.cordis.yml` text → structured rows.
 *
 * The composition is a top-level YAML list of plugin rows; a `cordis:group`
 * row carries its members as a nested `config` list. Parsing is strict about
 * the root shape (a non-list root cannot mount) and lenient about individual
 * rows (the diagnostics walk reports them).
 *
 * The studio schema extends js-yaml with the `!!js` scalar tag: compositions
 * carry `disabled: !!js <expression>` nodes, and both directions — reading
 * the file and re-emitting an edited row — must keep them as expressions,
 * never as strings.
 * @module @weilin-cool/dsh-preset-studio/src/core/yaml
 */

import yaml from 'js-yaml'
import type { CompositionRow } from './types.ts'

/** Result of one composition parse. */
export interface ParsedComposition {
  /** Top-level rows, or null when the document did not parse as a row list. */
  readonly rows: readonly CompositionRow[] | null
  /** The parse/root-shape problem, when there is one. */
  readonly problem?: string
}

/** One parsed row still in raw form. */
interface RawRow {
  readonly id?: unknown
  readonly name?: unknown
  readonly group?: unknown
  readonly disabled?: unknown
  readonly isolate?: unknown
  readonly config?: unknown
}

/** The `!!js` expression marker produced by the custom YAML type. */
interface JsExpr {
  readonly '!!js': string
}

/** Cordis group marker in a composition. */
const GROUP_NAME = 'cordis:group'

function isJsExpr(value: unknown): value is JsExpr {
  return typeof value === 'object' && value !== null && typeof (value as JsExpr)['!!js'] === 'string'
}

/** js-yaml schema extension: read and re-emit `!!js` scalar expressions. */
const JS_EXPR_TYPE = new yaml.Type('tag:yaml.org,2002:js', {
  kind: 'scalar',
  resolve: data => typeof data === 'string',
  construct: data => ({ '!!js': data }) as unknown,
  predicate: isJsExpr,
  represent: value => isJsExpr(value) ? value['!!js'] : String(value),
})

/** The studio schema: DEFAULT_SCHEMA plus the `!!js` expression type. */
export const STUDIO_SCHEMA = yaml.DEFAULT_SCHEMA.extend([JS_EXPR_TYPE])

/** True when a disabled node is a `!!js` expression marker. */
export function isJsExpression(value: unknown): boolean {
  return isJsExpr(value)
}

/** The expression text of a `!!js` marker. */
export function jsExpressionText(value: unknown): string | undefined {
  return isJsExpr(value) ? value['!!js'] : undefined
}

/**
 * Parse one raw row into the domain form. Anything that is not a plain object
 * becomes a malformed row (`name` absent) so the diagnostics walk can report
 * it rather than the parser throwing.
 * @param raw - the parsed YAML node.
 * @param index - this row's index path.
 * @returns the domain row.
 */
function parseRow(raw: unknown, index: readonly number[]): CompositionRow {
  const record = typeof raw === 'object' && raw !== null && !Array.isArray(raw)
    ? raw as RawRow
    : {}
  const name = typeof record.name === 'string' ? record.name : undefined
  const group = name === GROUP_NAME || record.group === true
  const members = group && Array.isArray(record.config) ? record.config : []
  return {
    index,
    ...record.id !== undefined && typeof record.id === 'string' ? { id: record.id } : {},
    ...name === undefined ? {} : { name },
    group,
    ...record.disabled === undefined ? {} : { disabled: record.disabled },
    ...record.isolate === undefined ? {} : { isolate: record.isolate },
    ...group ? {} : record.config === undefined ? {} : { config: record.config },
    children: members.map((member, i) => parseRow(member, [...index, i])),
  }
}

/**
 * Parse composition text into structured rows.
 * @param text - the composition exactly as stored.
 * @returns the rows, or the problem that kept the document from reading as a
 * composition (YAML syntax error, or a root that is not a list).
 */
export function parseComposition(text: string): ParsedComposition {
  let parsed: unknown
  try {
    parsed = yaml.load(text, { schema: STUDIO_SCHEMA })
  } catch (error) {
    return { rows: null, problem: `YAML 解析失败: ${String(error)}` }
  }
  if (!Array.isArray(parsed)) {
    return { rows: null, problem: '组合必须是顶层 YAML 列表（plugin rows）' }
  }
  return { rows: parsed.map((raw, i) => parseRow(raw, [i])) }
}

/**
 * Flatten a row tree in document order (groups before members).
 * @param rows - the top-level rows.
 * @returns every row, depth-first pre-order.
 */
export function flattenRows(rows: readonly CompositionRow[]): CompositionRow[] {
  const out: CompositionRow[] = []
  const walk = (row: CompositionRow): void => {
    out.push(row)
    for (const child of row.children) walk(child)
  }
  for (const row of rows) walk(row)
  return out
}

/** The stable node id of one row's index path. */
export function nodeId(index: readonly number[]): string {
  return `r${index.join('.')}`
}
