/**
 * verify-translation-pairing.ts (dependency-free)
 * Enforce complete bilingual pairs, matching structure, and recorded hashes.
 *
 * Usage:
 *   node --experimental-strip-types scripts/verify-translation-pairing.ts [--list] [--write] [--config <path>]
 *
 * Options:
 *   --list         Report pairing state without failing
 *   --write        Record confirmed pairs to sidecar files (not implemented yet)
 *   --config PATH  Path to docs-constraint.yaml
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, parse as parsePath, resolve, basename, relative } from 'node:path'
import { execSync } from 'node:child_process'

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', '.next', '.cache', 'coverage'])

/**
 * Parse a constrained YAML subset into native JS values.
 */
function parseYaml(text: string): unknown {
  const lines = text.split('\n')

  const stripComment = (s: string): string => {
    let inDouble = false, inSingle = false
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if (c === '"' && !inSingle) inDouble = !inDouble
      else if (c === "'" && !inDouble) inSingle = !inSingle
      else if (c === '#' && !inDouble && !inSingle) return s.slice(0, i)
    }
    return s
  }

  const parseScalar = (raw: string): unknown => {
    const v = raw.trim()
    if (v === '' || v === 'null' || v === '~') return null
    if (v === 'true') return true
    if (v === 'false') return false
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1)
    if (/^-?[0-9]+$/.test(v)) return parseInt(v, 10)
    if (/^-?[0-9]+\.[0-9]+$/.test(v)) return parseFloat(v)
    return v
  }

  const getIndent = (s: string): number => {
    let i = 0
    while (i < s.length && (s[i] === ' ' || s[i] === '\t')) i++
    return i
  }

  interface LineInfo { stripped: string; indent: number; trimmed: string }
  const processed: LineInfo[] = []
  for (const rawLine of lines) {
    const stripped = stripComment(rawLine)
    const trimmed = stripped.trim()
    processed.push({ stripped, indent: getIndent(stripped), trimmed })
  }

  const isNextLineList = (idx: number, currentIndent: number): boolean => {
    for (let j = idx + 1; j < processed.length; j++) {
      const next = processed[j]
      if (!next.trimmed || next.trimmed === '---') continue
      return next.indent > currentIndent && next.trimmed.startsWith('- ')
    }
    return false
  }

  const root: Record<string, unknown> = {}

  interface Frame {
    type: 'map' | 'array'
    indent: number
    target: Record<string, unknown> | unknown[]
  }
  const stack: Frame[] = [{ type: 'map', indent: -1, target: root }]

  for (let i = 0; i < processed.length; i++) {
    const { trimmed, indent } = processed[i]
    if (!trimmed || trimmed === '---') continue

    while (stack.length > 1) {
      const topFrame = stack[stack.length - 1]
      if (indent < topFrame.indent) {
        stack.pop()
      } else if (indent === topFrame.indent && topFrame.type === 'map') {
        stack.pop()
      } else {
        break
      }
    }

    const frame = stack[stack.length - 1]

    if (trimmed.startsWith('- ')) {
      if (frame.type !== 'array') {
        throw new Error('List item outside array at line ' + (i + 1) + ': ' + trimmed)
      }

      const itemContent = trimmed.slice(2).trim()
      const colonIdx = itemContent.indexOf(':')
      const targetArr = frame.target as unknown[]

      if (colonIdx > 0) {
        const key = itemContent.slice(0, colonIdx).trim()
        const valPart = itemContent.slice(colonIdx + 1).trim()
        const itemObj: Record<string, unknown> = {}
        itemObj[key] = parseScalar(valPart)
        targetArr.push(itemObj)
        stack.push({ type: 'map', indent, target: itemObj })
      } else if (itemContent.endsWith(':') || itemContent === '') {
        const itemObj: Record<string, unknown> = {}
        targetArr.push(itemObj)
        stack.push({ type: 'map', indent, target: itemObj })
      } else {
        targetArr.push(parseScalar(itemContent))
      }
      continue
    }

    const colonIdx = trimmed.indexOf(':')
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim()
      const valPart = trimmed.slice(colonIdx + 1).trim()

      if (frame.type !== 'map') {
        throw new Error('Key-value inside array at line ' + (i + 1))
      }

      const targetMap = frame.target as Record<string, unknown>

      if (valPart === '' || valPart.startsWith('#')) {
        if (isNextLineList(i, indent)) {
          const arr: unknown[] = []
          targetMap[key] = arr
          const nextIndent = processed.slice(i + 1).find(l => l.trimmed && l.trimmed.startsWith('- '))?.indent ?? indent + 2
          stack.push({ type: 'array', indent: nextIndent, target: arr })
        } else {
          const newObj: Record<string, unknown> = {}
          targetMap[key] = newObj
          stack.push({ type: 'map', indent, target: newObj })
        }
      } else if (valPart.startsWith('[')) {
        if (valPart === '[]') {
          targetMap[key] = []
        } else {
          const inner = valPart.slice(1, -1)
          targetMap[key] = inner.split(',').map(s => parseScalar(s.trim()))
        }
      } else if (valPart.startsWith('{')) {
        targetMap[key] = {}
      } else {
        targetMap[key] = parseScalar(valPart)
      }
      continue
    }
  }

  return root
}

function walkFiles(dir: string, base: string, out: string[]): string[] {
  let entries: string[]
  try { entries = readdirSync(dir) } catch { return out }
  for (const entry of entries) {
    const full = join(dir, entry)
    let st
    try { st = statSync(full) } catch { continue }
    if (st.isDirectory()) {
      if (IGNORED_DIRS.has(entry)) continue
      walkFiles(full, base, out)
    } else if (st.isFile()) {
      out.push(relative(base, full).split('\\').join('/'))
    }
  }
  return out
}

function globToRegExp(pattern: string): RegExp {
  let re = '', i = 0
  while (i < pattern.length) {
    const c = pattern[i]
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        re += '.*'; i += 2
        if (pattern[i] === '/') i++
      } else {
        re += '[^/]*'; i++
      }
    } else if (c === '?') {
      re += '[^/]'; i++
    } else if ('.+()[]{}^$|\\'.includes(c)) {
      re += '\\' + c; i++
    } else {
      re += c; i++
    }
  }
  return new RegExp('^' + re + '$')
}

function resolveGlob(pattern: string, baseDir: string): string[] {
  const all = walkFiles(baseDir, baseDir, [])
  const re = globToRegExp(pattern)
  return all.filter(f => re.test(f))
}

/** Compute git blob SHA-1 hash for content. */
function gitBlobHash(content: string): string {
  const header = 'blob ' + content.length + '\x00'
  return createHash('sha1').update(header + content).digest('hex')
}

/** Alternative: compute hash via git CLI. */
function gitBlobHashCLI(filePath: string): string {
  try {
    return execSync('git hash-object "' + filePath + '"', { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

/** Extract structural signature from markdown. */
function extractStructure(content: string): {
  headings: number[]
  codeBlocks: { lang: string; lines: number }[]
  tables: { rows: number; cols: number }[]
  lists: { kind: string; items: number }[]
} {
  const lines = content.split('\n')
  const headings: number[] = []
  const codeBlocks: { lang: string; lines: number }[] = []
  const tables: { rows: number; cols: number }[] = []
  const lists: { kind: string; items: number }[] = []

  let inCodeBlock = false
  let currentCodeBlock: { lang: string; lines: number } | null = null
  let inTable = false
  let tableCols = 0
  let tableRows = 0
  let currentList: { kind: string; items: number } | null = null

  for (const line of lines) {
    // Headings
    const headingMatch = line.match(/^(#{1,6})\s/)
    if (headingMatch) {
      headings.push(headingMatch[1].length)
    }

    // Code blocks
    if (line.startsWith('\`\`\`')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        currentCodeBlock = { lang: line.slice(3).trim(), lines: 0 }
      } else {
        if (currentCodeBlock) codeBlocks.push(currentCodeBlock)
        inCodeBlock = false
        currentCodeBlock = null
      }
    } else if (inCodeBlock && currentCodeBlock) {
      currentCodeBlock.lines++
    }

    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true
        tableCols = (line.match(/\|/g) || []).length - 1
        tableRows = 1
      } else {
        tableRows++
      }
    } else if (inTable) {
      if (tableRows > 0) tables.push({ rows: tableRows, cols: tableCols })
      inTable = false
      tableRows = 0
    }

    // Lists
    const ulMatch = line.match(/^(\s*)[-*+]\s/)
    const olMatch = line.match(/^(\s*)\d+\.\s/)
    if (ulMatch || olMatch) {
      const kind = ulMatch ? 'ul' : 'ol'
      if (!currentList || currentList.kind !== kind) {
        if (currentList) lists.push(currentList)
        currentList = { kind, items: 1 }
      } else {
        currentList.items++
      }
    } else if (currentList && !line.match(/^\s/)) {
      lists.push(currentList)
      currentList = null
    }
  }

  if (currentCodeBlock) codeBlocks.push(currentCodeBlock)
  if (inTable && tableRows > 0) tables.push({ rows: tableRows, cols: tableCols })
  if (currentList) lists.push(currentList)

  return { headings, codeBlocks, tables, lists }
}

function structuresMatch(a: ReturnType<typeof extractStructure>, b: ReturnType<typeof extractStructure>): boolean {
  return (
    JSON.stringify(a.headings) === JSON.stringify(b.headings) &&
    JSON.stringify(a.codeBlocks.map(c => ({ lang: c.lang, lines: c.lines }))) ===
      JSON.stringify(b.codeBlocks.map(c => ({ lang: c.lang, lines: c.lines }))) &&
    JSON.stringify(a.tables) === JSON.stringify(b.tables) &&
    JSON.stringify(a.lists) === JSON.stringify(b.lists)
  )
}

interface I18nConfig {
  enabled: boolean
  source_language: string
  target_languages: string[]
  suffix_map: Record<string, string>
  scope_patterns: string[]
  exclusions: string[]
}

interface Config {
  i18n?: I18nConfig
}

export function main(args: string[]): number {
  const listOnly = args.includes('--list')
  const writeMode = args.includes('--write')
  const configIndex = args.indexOf('--config')
  const configPath = configIndex >= 0 ? resolve(args[configIndex + 1]) : resolve('docs-constraint.yaml')

  if (!existsSync(configPath)) {
    console.error('Configuration not found: ' + configPath)
    return 1
  }

  const baseDir = dirname(configPath)
  const cfg = parseYaml(readFileSync(configPath, 'utf8')) as Config

  if (!cfg.i18n?.enabled) {
    console.log('verify-translation-pairing: i18n is disabled in configuration.')
    return 0
  }

  const i18n = cfg.i18n
  const suffixMap = i18n.suffix_map || {}
  const scopePatterns = i18n.scope_patterns || []
  const exclusions = i18n.exclusions || []

  // Check if a file matches any exclusion pattern
  const isExcluded = (file: string): boolean => {
    for (const pattern of exclusions) {
      if (pattern.includes('*')) {
        const re = globToRegExp(pattern)
        if (re.test(file)) return true
      } else if (file === pattern || file.startsWith(pattern + '/')) {
        return true
      }
    }
    return false
  }

  // Check if a file is a counterpart (translated) file
  const isCounterpart = (file: string): boolean => {
    for (const suffix of Object.values(suffixMap)) {
      if (file.endsWith(suffix)) return true
    }
    return false
  }

  // Discover source files
  const sourceFiles = new Set<string>()
  for (const pattern of scopePatterns) {
    const files = resolveGlob(pattern, baseDir)
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      if (isExcluded(file)) continue
      if (isCounterpart(file)) continue
      sourceFiles.add(file)
    }
  }

  const pairs: { source: string; counterpart: string; sidecar: string; consistent: boolean }[] = []
  const failures: string[] = []

  for (const source of sourceFiles) {
    const parsed = parsePath(source)
    const relDir = parsed.dir
    const baseName = parsed.name

    for (const [lang, suffix] of Object.entries(suffixMap)) {
      const counterpart = relDir ? join(relDir, baseName + suffix) : baseName + suffix
      const sidecar = relDir ? join(relDir, baseName + '.i18n.yaml') : baseName + '.i18n.yaml'

      const sourcePath = join(baseDir, source)
      const counterpartPath = join(baseDir, counterpart)
      const sidecarPath = join(baseDir, sidecar)

      const sourceExists = existsSync(sourcePath)
      const counterpartExists = existsSync(counterpartPath)
      const sidecarExists = existsSync(sidecarPath)

      let sourceHash = ''
      let recordedSourceHash = ''
      let recordedCounterpartHash = ''
      let structureMatch = false

      if (sourceExists) {
        sourceHash = gitBlobHash(readFileSync(sourcePath, 'utf8'))
      }

      if (sidecarExists) {
        try {
          const sidecarContent = readFileSync(sidecarPath, 'utf8')
          const sidecarData = parseYaml(sidecarContent) as Record<string, string>
          recordedSourceHash = sidecarData[basename(source)] || ''
          recordedCounterpartHash = sidecarData[basename(counterpart)] || ''
        } catch {
          // Invalid sidecar
        }
      }

      if (sourceExists && counterpartExists) {
        const sourceStruct = extractStructure(readFileSync(sourcePath, 'utf8'))
        const counterpartStruct = extractStructure(readFileSync(counterpartPath, 'utf8'))
        structureMatch = structuresMatch(sourceStruct, counterpartStruct)
      }

      const consistent = Boolean(
        sourceExists &&
        counterpartExists &&
        sidecarExists &&
        sourceHash === recordedSourceHash &&
        structureMatch
      )

      pairs.push({ source, counterpart, sidecar, consistent })

      if (!counterpartExists) {
        failures.push(source + ': missing counterpart ' + counterpart)
      }
      if (!sidecarExists) {
        failures.push(source + ': missing sidecar ' + sidecar)
      }
      if (sourceHash && recordedSourceHash && sourceHash !== recordedSourceHash) {
        failures.push(source + ': hash mismatch (current: ' + sourceHash + ', recorded: ' + recordedSourceHash + ')')
      }
      if (!structureMatch && sourceExists && counterpartExists) {
        failures.push(source + ': structure mismatch with counterpart')
      }
    }
  }

  if (listOnly) {
    console.log('Pair state:')
    for (const pair of pairs) {
      const status = pair.consistent ? 'ok' : 'FAIL'
      console.log('  ' + status.padEnd(5) + ' ' + pair.source)
    }
    return 0
  }

  if (failures.length > 0) {
    console.error('verify-translation-pairing failed:\n')
    for (const failure of failures) console.error('  ' + failure)
    console.error('\nSee docs/i18n/README.md for the pairing contract.')
    return 1
  }

  console.log('verify-translation-pairing: ' + pairs.length + ' pair(s) consistent.')
  return 0
}

// @ts-ignore
if (typeof import.meta?.main === 'boolean' && import.meta.main) {
  process.exitCode = main(process.argv.slice(2))
}
