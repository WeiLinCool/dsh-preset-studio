/**
 * Row surgery: line-range editing of the composition draft.
 *
 * The studio edits the YAML text, not an AST, so edits that touch one row
 * (config form writes, row removal, palette appends) locate the row's source
 * lines and splice text — everything outside the touched row keeps its
 * comments and formatting. Only the edited row is re-emitted from the
 * structured form, so comments INSIDE that row are lost (documented).
 * @module @tieveto666-code/dsh-preset-studio/src/core/edit
 */

import yaml from 'js-yaml'
import type { CompositionRow } from './types.ts'
import { parseComposition, STUDIO_SCHEMA } from './yaml.ts'

/** A half-open line range [start, end). */
export interface LineRange {
  readonly start: number
  readonly end: number
}

/** A list entry line at `indent` spaces, spanning to `end`. */
interface EntryLine {
  readonly line: number
  readonly indent: number
  readonly end: number
}

/** Match a list entry (`- `) starting at exactly `indent` spaces. */
function entryAt(lines: readonly string[], from: number, to: number, indent: number, index: number): EntryLine | null {
  let seen = 0
  let i = from
  while (i < to) {
    const line = lines[i]
    const match = /^(\s*)-\s/.exec(line)
    if (match !== null && match[1].length === indent) {
      if (seen === index) {
        // Span ends at the next entry at this same indent, else at scope end.
        let end = to
        for (let j = i + 1; j < to; j++) {
          const next = /^(\s*)-\s/.exec(lines[j])
          if (next !== null && next[1].length === indent) {
            end = j
            break
          }
        }
        return { line: i, indent, end }
      }
      seen++
    }
    i++
  }
  return null
}

/** The indentation of the first child entry inside a group row's span. */
function childIndent(lines: readonly string[], from: number, to: number): number | null {
  let best: number | null = null
  for (let i = from; i < to; i++) {
    const match = /^(\s*)-\s/.exec(lines[i])
    if (match === null) continue
    const indent = match[1].length
    if (best === null || indent < best) best = indent
  }
  return best
}

/**
 * Locate one row's source lines by its index path.
 * @param text - the composition draft.
 * @param indexPath - the row's index path from the top-level list.
 * @returns the line range, or null when the text no longer parses / the path
 * is out of bounds.
 */
export function rowLineRange(text: string, indexPath: readonly number[]): LineRange | null {
  const lines = text.split('\n')
  let from = 0
  let to = lines.length
  let indent = 0
  for (let depth = 0; depth < indexPath.length; depth++) {
    const entry = entryAt(lines, from, to, indent, indexPath[depth])
    if (entry === null) return null
    from = entry.line
    to = entry.end
    if (depth + 1 < indexPath.length) {
      const nested = childIndent(lines, entry.line + 1, entry.end)
      if (nested === null) return null
      indent = nested
    }
  }
  return { start: from, end: to }
}

/** Rebuild the raw YAML form of one structured row. */
export function rowToRaw(row: CompositionRow): Record<string, unknown> {
  const raw: Record<string, unknown> = {}
  if (row.id !== undefined) raw.id = row.id
  if (row.name !== undefined) raw.name = row.name
  if (row.disabled !== undefined) raw.disabled = row.disabled
  if (row.isolate !== undefined) raw.isolate = row.isolate
  if (row.group) {
    raw.config = row.children.map(rowToRaw)
  } else if (row.config !== undefined) {
    raw.config = row.config
  }
  return raw
}

/**
 * Re-emit one row as a YAML list entry.
 * @param row - the structured row.
 * @param indent - spaces before the `- ` (children of groups are nested).
 * @returns the YAML block, ending with a newline.
 */
export function dumpRowBlock(row: CompositionRow, indent = 0): string {
  const dumped = yaml.dump([rowToRaw(row)], { lineWidth: -1, noRefs: true, schema: STUDIO_SCHEMA })
  const pad = ' '.repeat(indent)
  return dumped.split('\n').map(line => line === '' ? '' : `${pad}${line}`).join('\n')
}

/**
 * Deep-read a dotted path from a config object.
 * @param config - the row's config object.
 * @param path - dotted path, e.g. `nested.flag`.
 * @returns the value at the path, or undefined.
 */
export function getPath(config: unknown, path: string): unknown {
  if (typeof config !== 'object' || config === null) return undefined
  let node: unknown = config
  for (const part of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return node
}

/**
 * Deep-set a dotted path in a config object, creating the intermediate
 * objects. Returns a NEW root object (the original is not mutated).
 * @param config - the row's current config (anything).
 * @param path - dotted path.
 * @param value - the value to store.
 * @returns the updated config object.
 */
export function setPath(config: unknown, path: string, value: unknown): Record<string, unknown> {
  const root = typeof config === 'object' && config !== null && !Array.isArray(config)
    ? { ...config as Record<string, unknown> }
    : {}
  const parts = path.split('.')
  let node = root
  for (let i = 0; i < parts.length - 1; i++) {
    const existing = node[parts[i]]
    const next = typeof existing === 'object' && existing !== null && !Array.isArray(existing)
      ? { ...existing as Record<string, unknown> }
      : {}
    node[parts[i]] = next
    node = next
  }
  node[parts[parts.length - 1]] = value
  return root
}

/**
 * Apply a dotted-path write to one row of the draft: locate the row, update
 * its config, re-emit only that row's YAML, and splice it back.
 * @param text - the composition draft.
 * @param indexPath - the row's index path.
 * @param path - dotted config path.
 * @param value - the value to store.
 * @returns the new draft, or null when the draft does not parse or the path
 * is out of bounds (the draft is left untouched in that case).
 */
export function editRowConfig(text: string, indexPath: readonly number[], path: string, value: unknown): string | null {
  const parsed = parseComposition(text)
  if (parsed.rows === null) return null
  const row = findRow(parsed.rows, indexPath)
  const range = rowLineRange(text, indexPath)
  if (row === null || range === null) return null
  const config = setPath(row.config, path, value)
  const next: CompositionRow = { ...row, ...row.group ? {} : { config } }
  const block = dumpRowBlock(next, indentOf(text, range))
  const lines = text.split('\n')
  const spliced = [...lines.slice(0, range.start), block.replace(/\n$/, ''), ...lines.slice(range.end)]
  return spliced.join('\n')
}

/**
 * Remove one row's source lines from the draft.
 * @param text - the composition draft.
 * @param indexPath - the row's index path.
 * @returns the new draft, or null when the path is out of bounds.
 */
export function removeRow(text: string, indexPath: readonly number[]): string | null {
  const range = rowLineRange(text, indexPath)
  if (range === null) return null
  const lines = text.split('\n')
  return [...lines.slice(0, range.start), ...lines.slice(range.end)].join('\n')
}

/**
 * Append a YAML row block to the draft's top-level list.
 * @param text - the composition draft.
 * @param block - the YAML list entry to append.
 * @returns the new draft.
 */
export function appendRow(text: string, block: string): string {
  const entry = block.endsWith('\n') ? block : `${block}\n`
  return text === '' ? entry : text.endsWith('\n') ? `${text}${entry}` : `${text}\n${entry}`
}

/** Walk one row out of a parsed tree by index path. */
function findRow(rows: readonly CompositionRow[], indexPath: readonly number[]): CompositionRow | null {
  let current: CompositionRow | undefined
  let level = rows
  for (const index of indexPath) {
    current = level[index]
    if (current === undefined) return null
    level = current.children
  }
  return current ?? null
}

/** The indentation of a row block's list marker (for nested rows). */
function indentOf(text: string, range: LineRange): number {
  const line = text.split('\n')[range.start] ?? ''
  const match = /^(\s*)-\s/.exec(line)
  return match === null ? 0 : match[1].length
}
