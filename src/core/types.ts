/**
 * Shared domain model for the preset studio: the Harness Graph DSL.
 *
 * The design follows the architecture spec: the canvas graph is a
 * visualization projection, never the source of truth — the composition file
 * (`agent.cordis.yml`) is. Every type here is framework-free so the browser
 * bundle, the host half, and the test suite share one vocabulary.
 * @module @tieveto666-code/dsh-preset-studio/src/core/types
 */

/** The studio views the section opens on. */
export type StudioView = 'graph' | 'yaml' | 'diff'

/** The five connection kinds of the Harness Graph DSL (spec §五). */
export type EdgeType = 'service' | 'event' | 'context' | 'data' | 'lifecycle'

/**
 * One plugin row's business category — a Runtime Capability, not a workflow
 * step. Mirrors PluginManifest.category in the spec (§六) plus `group` for
 * `cordis:group` rows and `persona` for the identity plane.
 */
export type CapabilityKind =
  | 'model'
  | 'loop'
  | 'memory'
  | 'tool'
  | 'skill'
  | 'storage'
  | 'persona'
  | 'group'
  | 'other'

/** One parsed composition entry (a plugin row, possibly a group with children). */
export interface CompositionRow {
  /** Index path from the top-level list, e.g. [3, 1] = group 3's second child. */
  readonly index: readonly number[]
  /** Declared row id (composition ids are free-form; may be absent). */
  readonly id?: string
  /** Module specifier the row names (package, `cordis:*`, or a path). */
  readonly name?: string
  /** Whether the row is a `cordis:group` container. */
  readonly group: boolean
  /** Raw `disabled` node: boolean, `!!js` expression, or whatever else. */
  readonly disabled?: unknown
  /** Raw `isolate` node, when the group declares an isolate realm. */
  readonly isolate?: unknown
  /** The row's `config` as parsed, for non-group rows. */
  readonly config?: unknown
  /** Group members, for `cordis:group` rows. */
  readonly children: readonly CompositionRow[]
}

/** Enablement as the graph reports it. */
export type RowEnablement = boolean | 'conditional'

/** One graph node: a composition row projected as a Runtime Capability. */
export interface HarnessNode {
  /** Stable node id derived from the index path (`r0`, `r0.1`, …). */
  readonly id: string
  /** Declared row id, when the row declares one. */
  readonly rowId?: string
  /** Module specifier, absent only for malformed rows. */
  readonly moduleName?: string
  /** Business category. */
  readonly kind: CapabilityKind
  /** Group nesting depth. */
  readonly depth: number
  /** Group node id when nested; absent for top-level rows. */
  readonly parentId?: string
  /** Whether the node has group members. */
  readonly hasChildren: boolean
  /** Effective enablement read from the file (boolean, or conditional `!!js`). */
  readonly enabled: RowEnablement
  /** The row's own `!!js` disabled expression, when it carries one. */
  readonly condition?: string
  /** The row's config as parsed. */
  readonly config?: unknown
  /** Services this row provides (curated registry knowledge). */
  readonly provides: readonly string[]
  /** Services this row consumes (curated registry knowledge). */
  readonly consumes: readonly string[]
  /** Whether the bundled registry knows this module. */
  readonly known: boolean
}

/** One graph edge. Every edge kind is provable from the composition file. */
export interface HarnessEdge {
  readonly id: string
  readonly source: string
  readonly target: string
  readonly type: EdgeType
}

/** One composition problem the studio reports. */
export interface CompositionDiagnostic {
  /** How bad the problem is: errors block mounting, warnings do not. */
  readonly severity: 'error' | 'warning'
  /** Human-readable message (English — the UI localizes common cases). */
  readonly message: string
  /** Index path of the offending row, when one row owns the problem. */
  readonly index?: string
}

/** The projected graph plus its diagnostics. */
export interface HarnessGraph {
  readonly nodes: readonly HarnessNode[]
  readonly edges: readonly HarnessEdge[]
  readonly diagnostics: readonly CompositionDiagnostic[]
}

/** One entry of the bundled plugin registry (the curated introspection catalog). */
export interface RegistryEntry {
  /** Module specifier, matched exactly. */
  readonly module: string
  /** Business category this module belongs to. */
  readonly kind: CapabilityKind
  /** Short display label (English; the UI localizes where needed). */
  readonly label: string
  /** One sentence on what the plugin row does. */
  readonly description: string
  /** Services this row publishes into the composition. */
  readonly provides: readonly string[]
  /** Services this row consumes from sibling rows. */
  readonly consumes: readonly string[]
  /** Curated config schema; absent means "edit the YAML directly". */
  readonly configSchema?: JsonObjectSchema
  /** YAML fragment appended when the row is added through the palette. */
  readonly template: string
}

/** The JSON Schema subset the schema-driven form understands. */
export interface JsonObjectSchema {
  readonly type: 'object'
  readonly properties?: Readonly<Record<string, JsonSchemaProperty>>
}

/** One property of the schema subset. */
export interface JsonSchemaProperty {
  readonly type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  readonly title?: string
  readonly description?: string
  readonly minimum?: number
  readonly maximum?: number
  readonly default?: unknown
  readonly enum?: readonly (string | number)[]
  readonly items?: JsonSchemaProperty
  readonly properties?: Readonly<Record<string, JsonSchemaProperty>>
}
