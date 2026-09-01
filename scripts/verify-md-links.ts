/**
 * verify-md-links.ts
 * Verify that relative Markdown links, images, and fragment anchors resolve.
 * Self-contained (no external dependencies) so it runs anywhere with
 * `node --experimental-strip-types`.
 *
 * Checks, for every markdown file in scope:
 *   - [text](target) and ![alt](target): target file must exist relative to
 *     the source file.
 *   - #fragment onto a Markdown target (including a same-file #anchor): the
 *     fragment must name a real heading slug or an explicit <a id="...">.
 * Excluded: http(s): URLs, mailto:, root-absolute (/...) paths, and files under
 * the standard ignored directories (node_modules, .git, dist, build, vendor).
 * Query strings do not affect resolution.
 *
 * Usage:
 *   node --experimental-strip-types scripts/verify-md-links.ts [--config <path>]
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

interface LinkTarget {
  file: string
  hash: string | null
}

/** Directories never scanned for or into when checking links. */
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', '.next', '.cache', 'coverage'])

/** A dependency-free recursive walk returning relative markdown paths. */
function walkMarkdown(dir: string, base: string, out: string[]): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    let stat: ReturnType<typeof statSync>
    try {
      stat = statSync(full)
    } catch {
      continue
    }
    if (stat.isDirectory()) {
      if (IGNORED_DIRS.has(entry)) continue
      walkMarkdown(full, base, out)
    } else if (stat.isFile() && entry.endsWith('.md')) {
      out.push(relative(base, full))
    }
  }
  return out
}

/** Extract prose lines (skip fenced code blocks). */
function proseLines(content: string): string[] {
  const lines = content.split('\n')
  const out: string[] = []
  let inFence = false
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (!inFence) out.push(line)
  }
  return out
}

/** Convert a heading to its GitHub-style anchor slug. */
function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[\.:\/()]/g, '')
    .replace(/[^\w\u4e00-\u9fa5 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/** Collect heading slugs and explicit anchor ids from prose. */
function collectAnchors(lines: string[]): Set<string> {
  const anchors = new Set<string>()
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) anchors.add(slugify(heading[2] ?? ''))
    const idMatch = line.match(/<a\s+id=["']([^"']+)["']\s*\/?>/)
    if (idMatch) anchors.add(idMatch[1] ?? '')
  }
  return anchors
}

/** Parse inline links and images out of a line of prose. */
function* inlineTargets(line: string): Generator<LinkTarget> {
  const re = /!?\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    const raw = (m[2] ?? '').trim()
    if (!raw || raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto://') || raw.startsWith('mailto:')) continue
    const hashIdx = raw.indexOf('#')
    const pathPart = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw
    const hashPart = hashIdx >= 0 ? raw.slice(hashIdx + 1) : ''
    if (pathPart.startsWith('/')) continue // root-absolute: out of scope
    yield { file: decodeURIComponent(pathPart), hash: hashPart || null }
  }
}

function isExcluded(rel: string, exclusions: string[]): boolean {
  return exclusions.some((p) => {
    const pat = p.endsWith('/') ? p.slice(0, -1) : p
    if (pat.includes('*')) {
      const re = new RegExp('^' + pat.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$')
      return re.test(rel)
    }
    return rel === pat || rel.startsWith(pat + '/')
  })
}

/** Lightweight YAML list read for the exclusions key. */
function readExclusions(configPath: string): string[] {
  const exclusions: string[] = []
  if (!existsSync(configPath)) return exclusions
  const lines = readFileSync(configPath, 'utf8').split('\n')
  let inExclusions = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === 'exclusions:') { inExclusions = true; continue }
    if (inExclusions) {
      if (/^-\s+/.test(trimmed)) {
        exclusions.push(trimmed.replace(/^-\s+/, '').replace(/['"]/g, ''))
      } else if (trimmed !== '' && !trimmed.startsWith('#')) {
        inExclusions = false
      }
    }
  }
  return exclusions
}

export function main(args: string[]): number {
  const configIndex = args.indexOf('--config')
  const configPath = configIndex >= 0 ? resolve(args[configIndex + 1]) : resolve('docs-constraint.yaml')
  const baseDir = dirname(configPath)
  const exclusions = readExclusions(configPath)
  const files = walkMarkdown(baseDir, baseDir, [])
  const failures: string[] = []
  let count = 0

  for (const rel of files) {
    if (isExcluded(rel, exclusions)) continue
    const abs = resolve(baseDir, rel)
    let content: string
    try {
      content = readFileSync(abs, 'utf8')
    } catch {
      failures.push(rel + ': unreadable markdown file')
      continue
    }
    const lines = proseLines(content)
    const anchors = collectAnchors(lines)
    const srcDir = dirname(abs)

    for (let i = 0; i < lines.length; i++) {
      for (const target of inlineTargets(lines[i] ?? '')) {
        count++
        // Same-file fragment (#anchor) or cross-file; resolve the target file.
        const sameFile = target.file === '' || (!target.file.includes('/') && !target.file.includes('.') && target.hash !== null)
        let targetAbs = target.file === '' ? abs : resolve(srcDir, target.file)
        const targetRel = relative(baseDir, targetAbs)
        let targetStat
        try {
          targetStat = statSync(targetAbs)
        } catch {
          if (target.hash === null || sameFile) {
            failures.push(rel + ':' + (i + 1) + ': target not found: ' + target.file)
          }
          continue
        }
        // Validate the fragment against the file that actually owns the anchor.
        if (target.hash !== null) {
          const anchorFile = targetStat.isFile() && extname(targetAbs) === '.md' ? targetAbs : abs
          const ownAnchors = collectAnchors(proseLines(readFileSync(anchorFile, 'utf8')))
          if (!ownAnchors.has(target.hash)) {
            failures.push(rel + ':' + (i + 1) + ': fragment #' + target.hash + ' not found in ' + relative(baseDir, anchorFile))
          }
        } else if (!sameFile && !targetStat.isFile()) {
          failures.push(rel + ':' + (i + 1) + ': target not found: ' + target.file)
        }
      }
    }
  }

  if (failures.length > 0) {
    console.error('verify-md-links failed:')
    for (const f of failures) console.error('  ' + f)
    return 1
  }
  console.log('verify-md-links: ' + count + ' link(s) across ' + files.length + ' file(s) resolved.')
  return 0
}

if (import.meta.main) {
  process.exitCode = main(process.argv.slice(2))
}
