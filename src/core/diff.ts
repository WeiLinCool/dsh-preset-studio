/**
 * Preset diff (spec §九): line-level diff for the composition text and a
 * row-set diff answering which capability rows were added / removed.
 * @module @tieveto666-code/dsh-preset-studio/src/core/diff
 */

import { flattenRows, parseComposition } from './yaml.ts'

/** One line of a line diff. */
export interface DiffLine {
  /** Line kind. */
  readonly kind: 'same' | 'add' | 'del'
  /** Line content, without the terminator. */
  readonly text: string
}

/** One row's identity inside a row-set diff. */
export interface RowKey {
  /** Declared row id, when present. */
  readonly id?: string
  /** Module specifier. */
  readonly moduleName: string
}

/** A comparison of two compositions' capability rows. */
export interface RowSetDiff {
  /** Rows only in B (added). */
  readonly added: readonly RowKey[]
  /** Rows only in A (removed). */
  readonly removed: readonly RowKey[]
  /** Rows present in both (matched by id, else by module occurrence). */
  readonly unchanged: readonly RowKey[]
}

/** Longest-common-subsequence table over two line arrays. */
function lcsTable(a: readonly string[], b: readonly string[]): Int32Array[] {
  const table: Int32Array[] = new Array(a.length + 1)
  for (let i = 0; i <= a.length; i++) table[i] = new Int32Array(b.length + 1)
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  return table
}

/**
 * Line diff between two texts (the DiffBlock primitive renders its own;
 * this pure fold exists for tests, stats, and the row-set derivation).
 * @param before - the old text.
 * @param after - the new text.
 * @returns the diff, hunks merged into one ordered line list.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n')
  const b = after.split('\n')
  const table = lcsTable(a, b)
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i] })
      i++
      j++
    } else if (j < b.length && (i >= a.length || table[i][j + 1] >= table[i + 1][j])) {
      out.push({ kind: 'add', text: b[j] })
      j++
    } else if (i < a.length) {
      out.push({ kind: 'del', text: a[i] })
      i++
    } else {
      out.push({ kind: 'add', text: b[j] })
      j++
    }
  }
  return out
}

/** A stable key for one row. */
function keyOf(rowId: string | undefined, moduleName: string | undefined): RowKey | undefined {
  if (moduleName === undefined) return undefined
  return { ...rowId === undefined ? {} : { id: rowId }, moduleName }
}

/**
 * Compare two compositions' capability rows.
 *
 * Matching prefers the declared row id; rows without ids match by module name
 * occurrence, so duplicating a plugin reads as an addition.
 * @param before - the old composition text.
 * @param after - the new composition text.
 * @returns the row-set difference, or null when either side does not parse.
 */
export function diffRows(before: string, after: string): RowSetDiff | null {
  const left = parseComposition(before).rows
  const right = parseComposition(after).rows
  if (left === null || right === null) return null
  const leftRows = flattenRows(left).map(row => keyOf(row.id, row.name)).filter((row): row is RowKey => row !== undefined)
  const rightRows = flattenRows(right).map(row => keyOf(row.id, row.name)).filter((row): row is RowKey => row !== undefined)

  // Id-matched rows drop out of both pools; the remainder matches by module
  // name occurrence in order.
  const remainingRight = [...rightRows]
  const unchanged: RowKey[] = []
  const removed: RowKey[] = []
  for (const row of leftRows) {
    const byId = row.id === undefined ? -1 : remainingRight.findIndex(candidate => candidate.id === row.id)
    const byModule = remainingRight.findIndex(candidate => candidate.moduleName === row.moduleName)
    const at = byId >= 0 ? byId : byModule
    if (at >= 0) {
      const match = remainingRight.splice(at, 1)[0]
      unchanged.push(match)
    } else {
      removed.push(row)
    }
  }
  return { added: remainingRight, removed, unchanged }
}

/** Total added/removed lines of a line diff. */
export function diffTotals(lines: readonly DiffLine[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const line of lines) {
    if (line.kind === 'add') added++
    else if (line.kind === 'del') removed++
  }
  return { added, removed }
}
