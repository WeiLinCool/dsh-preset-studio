/**
 * Addable component entries: the curated registry projected onto a uniform
 * item shape, plus unregistered installed plugins classified by module. The
 * canvas add-node menu consumes these items and ranks capability kinds
 * relative to the clicked node.
 */
import { classifyModule } from '../core/classify.ts'
import { REGISTRY } from '../core/registry.ts'
import type { CapabilityKind } from '../core/types.ts'
import type { PluginInventoryEntry } from './wire.ts'

/** Searchable text of one addable item. */
function itemSearchText(entry: AddableEntry, kindLabels: Readonly<Record<CapabilityKind, string>>): string {
  return [entry.label, entry.module, entry.description, entry.kind, kindLabels[entry.kind] ?? '']
    .join(' ')
    .toLowerCase()
}

/** One item the canvas context menu can insert. */
export interface AddableEntry {
  /** Stable item key (module for registry rows, prefixed module for inventory). */
  readonly key: string
  /** Short display label. */
  readonly label: string
  /** Module specifier. */
  readonly module: string
  /** Capability category this item belongs to. */
  readonly kind: CapabilityKind
  /** One-sentence description. */
  readonly description: string
  /** YAML row block appended / inserted on pick. */
  readonly template: string
  /** Whether the bundled registry knows this module. */
  readonly known: boolean
}

/** Palette / menu display order of capability kinds. */
export const KIND_ORDER: readonly CapabilityKind[] = [
  'model', 'loop', 'memory', 'tool', 'skill', 'storage', 'persona', 'group', 'other',
]

/** Capability kinds that commonly pair with a clicked node of each kind. */
const RELATED_KINDS: Readonly<Record<CapabilityKind, readonly CapabilityKind[]>> = {
  model: ['memory', 'tool', 'loop'],
  loop: ['memory', 'tool', 'skill', 'storage'],
  memory: ['memory', 'tool', 'storage'],
  tool: ['tool', 'memory', 'skill'],
  skill: ['skill', 'tool'],
  storage: ['storage', 'tool', 'memory'],
  persona: ['persona', 'tool', 'loop', 'memory'],
  group: ['model', 'loop', 'memory', 'tool', 'skill', 'storage', 'persona'],
  other: ['model', 'loop', 'memory', 'tool', 'skill', 'storage', 'persona', 'group'],
}

/** Build the YAML template one installed (unregistered) plugin row uses. */
export function installedTemplate(moduleName: string): string {
  const safe = moduleName.replace(/[^a-z0-9-]/g, '-').slice(-24)
  return `- id: plugin-${safe}\n  name: '${moduleName}'`
}

/**
 * Project the registry plus the installed inventory into addable items.
 * @param inventoryEntries - the deployment's plugin inventory.
 * @returns registry items first (curated), then unregistered installed rows.
 */
export function addableEntries(inventoryEntries: readonly PluginInventoryEntry[]): AddableEntry[] {
  const registered = new Set(REGISTRY.map(entry => entry.module))
  const fromRegistry: AddableEntry[] = REGISTRY.map(entry => ({
    key: entry.module,
    label: entry.label,
    module: entry.module,
    kind: entry.kind,
    description: entry.description,
    template: entry.template,
    known: true,
  }))
  const fromInventory: AddableEntry[] = inventoryEntries
    .filter(entry => !registered.has(entry.moduleName))
    .map(entry => ({
      key: `installed:${entry.moduleName}`,
      label: entry.moduleName.replace(/^@deepseek-ai\/dsh-/, ''),
      module: entry.moduleName,
      kind: classifyModule(entry.moduleName),
      description: entry.moduleName,
      template: installedTemplate(entry.moduleName),
      known: false,
    }))
  return [...fromRegistry, ...fromInventory]
}

/**
 * Group addable items by capability kind, in first-seen order.
 * @param entries - the addable items.
 * @returns kind → its items.
 */
export function groupAddableEntries(entries: readonly AddableEntry[]): Map<CapabilityKind, AddableEntry[]> {
  const grouped = new Map<CapabilityKind, AddableEntry[]>()
  for (const entry of entries) {
    const list = grouped.get(entry.kind) ?? []
    list.push(entry)
    grouped.set(entry.kind, list)
  }
  return grouped
}

/**
 * Filter addable items by free text (label / module / description / kind
 * label) and by an optional single category.
 * @param entries - the addable items.
 * @param query - trimmed free-text query; empty disables the text clause.
 * @param activeKind - the selected category, or null for all categories.
 * @param kindLabels - display labels used by the text clause.
 * @returns the items matching both clauses.
 */
export function filterAddableEntries(
  entries: readonly AddableEntry[],
  query: string,
  activeKind: CapabilityKind | null,
  kindLabels: Readonly<Record<CapabilityKind, string>>,
): AddableEntry[] {
  const q = query.trim().toLowerCase()
  return entries.filter((entry) => {
    if (activeKind !== null && entry.kind !== activeKind) return false
    if (q === '') return true
    return itemSearchText(entry, kindLabels).includes(q)
  })
}

/**
 * Rank capability kinds for one anchor node: commonly-related kinds first,
 * then every remaining available kind in the standard display order.
 * @param anchorKind - the clicked node's capability kind.
 * @param available - kinds that actually have addable items.
 * @returns the ordered kind list.
 */
export function relatedKindOrder(
  anchorKind: CapabilityKind,
  available: Iterable<CapabilityKind>,
): CapabilityKind[] {
  const present = new Set(available)
  const related = RELATED_KINDS[anchorKind] ?? []
  const relatedPresent = related.filter(kind => present.has(kind))
  const rest = KIND_ORDER.filter(kind => present.has(kind) && !relatedPresent.includes(kind))
  return [...relatedPresent, ...rest]
}
