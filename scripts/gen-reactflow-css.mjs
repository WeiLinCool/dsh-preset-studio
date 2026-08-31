/**
 * Regenerate src/client/reactflow-base.module.css from @xyflow/react's
 * upstream stylesheet, scoped under [data-dsh-preset-studio-panel].
 *
 * Every selector is wrapped in :global() and prefixed with the panel scope so
 * CSS Modules leaves third-party class names untouched while the styles only
 * apply to this plugin's ReactFlow instance. Keyframes stay global (their
 * animation property is only applied by scoped rules).
 *
 * Usage: pnpm gen:reactflow-css  (after upgrading @xyflow/react)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const PANEL = 'dsh-preset-studio-panel'
const OUTPUT = resolve(dirname(new URL(import.meta.url).pathname), '../src/client/reactflow-base.module.css')
const SOURCE = resolve(require.resolve('@xyflow/react/dist/style.css'), '..', 'style.css')

/** One CSS rule block. */
function parseBlocks(source) {
  const blocks = []
  let index = 0
  let depth = 0
  let headerStart = 0
  let bodyStart = -1
  let inComment = false
  let inString = null
  while (index < source.length) {
    const char = source[index]
    const next = source[index + 1]
    if (inComment) {
      if (char === '*' && next === '/') {
        inComment = false
        index += 2
        // Top-level comments are not part of the next rule's header.
        if (depth === 0) headerStart = index
        continue
      }
      index++
      continue
    }
    if (char === '/' && next === '*') {
      inComment = true
      index += 2
      continue
    }
    if (inString !== null) {
      if (char === '\\') index += 2
      else if (char === inString) inString = null
      else index++
      continue
    }
    if (char === '"' || char === "'") {
      inString = char
      index++
      continue
    }
    if (char === '{') {
      depth++
      if (depth === 1) bodyStart = index + 1
      index++
      continue
    }
    if (char === '}') {
      depth--
      if (depth === 0) {
        // bodyStart points just past the opening brace; the header ends at it.
        const header = source.slice(headerStart, bodyStart - 1).trim()
        const body = source.slice(bodyStart, index)
        blocks.push({ header, body })
        headerStart = index + 1
      }
      index++
      continue
    }
    index++
  }
  return blocks
}

/** Split a selector list on top-level commas (not inside parens/brackets). */
function splitSelectors(selector) {
  const parts = []
  let depth = 0
  let current = ''
  for (const char of selector) {
    if (char === '(' || char === '[') depth++
    if (char === ')' || char === ']') depth--
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim() !== '') parts.push(current.trim())
  return parts
}

/** Scope one rule body recursively (handles @media / @supports wrappers). */
function scopeRule(header, body, indent = '') {
  const trimmed = header.trimStart()
  if (trimmed.startsWith('@keyframes') || trimmed.startsWith('@-webkit-keyframes')) {
    // Global keyframes: animation names are referenced by scoped rules only.
    return `${indent}${header} {\n${body}${indent}}\n`
  }
  if (trimmed.startsWith('@media') || trimmed.startsWith('@supports') || trimmed.startsWith('@layer')) {
    const inner = parseBlocks(body).map(block => scopeRule(block.header, block.body, `${indent}  `)).join('')
    return `${indent}${header} {\n${inner}${indent}}\n`
  }
  const selectors = splitSelectors(header).map(selector => `${indent}[data-${PANEL}] :global(${selector})`)
  return `${selectors.join(',\n')}{\n${body}\n${indent}}\n`
}

const source = readFileSync(SOURCE, 'utf8')
const blocks = parseBlocks(source)
const scoped = blocks.map(block => scopeRule(block.header, block.body)).join('\n')

const header = `/* GENERATED from @xyflow/react/dist/style.css and locally scoped for this plugin.
 * Source: @xyflow/react/dist/style.css (v12, base theming + required layout
 * styles), every ReactFlow selector is wrapped in :global() and scoped under
 * [data-${PANEL}] so CSS Modules leaves third-party class names untouched
 * without styling other ReactFlow instances.
 * Regenerate after ReactFlow upgrades with the script named above.
 */\n\n`

writeFileSync(OUTPUT, header + scoped)
console.log(`wrote ${OUTPUT} (${scoped.length} chars scoped output)`)
