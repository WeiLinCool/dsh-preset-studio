/**
 * Vendored wire contracts: type-only mirrors of the Host remote payloads the
 * studio consumes (`agentPresets` and `pluginInventory` remotes).
 *
 * The shapes are mirrored from the harness source
 * (packages/preset/agent-presets/src/types.ts and
 * packages/host/plugin-inventory/src/types.ts) because the published npm
 * versions of the host packages lag the running web profile. They are plain
 * JSON payloads — the browser only ever sees these fields.
 * @module @weilin-cool/dsh-preset-studio/src/client/wire
 */

import type { Context } from '@deepseek-ai/cordis'

/** The Remote result wrapper every generated face returns. */
export type RemoteResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } }

/** One preset roster row as a client reads it (path-free, id-addressed). */
export interface AgentPresetRow {
  readonly id: string
  readonly trust: 'system' | 'user'
  readonly isDefault: boolean
  readonly name?: string
  readonly description?: string
  /** Why this preset cannot compose a session; absent when it can. */
  readonly broken?: string
}

/** The roster one deployment currently supplies, with its authoring capability. */
export interface AgentPresetRoster {
  readonly presets: readonly AgentPresetRow[]
  /** Whether this deployment has a root locally authored presets go to. */
  readonly authorable: boolean
}

/** One preset's composition text beside the row it belongs to. */
export interface AgentPresetDocument {
  readonly agentPreset: string
  readonly trust: 'system' | 'user'
  /** The composition exactly as stored. */
  readonly content: string
  readonly name?: string
  readonly description?: string
}

/** The answer of `settings.openAgentPresetDirectory`. */
export type AgentPresetDirectoryOpenValue =
  | { readonly opened: true }
  | { readonly opened: false; readonly path: string }

/** One non-group Loader entry exposed to trusted clients. */
export interface PluginInventoryEntry {
  readonly entryId: string
  readonly moduleName: string
  readonly enabled: boolean
  readonly fiberPhase: 'pending' | 'loading' | 'active' | 'failed' | 'unloading' | null
}

/** Effective enablement of one preset composition row. */
export type PresetPluginEnablement = boolean | 'conditional'

/** One plugin row an agent preset's composition names. */
export interface AgentPresetPluginRow {
  readonly entryId: string | null
  readonly moduleName: string
  readonly enabled: PresetPluginEnablement
  readonly condition?: string
  readonly fiberPhase: 'pending' | 'loading' | 'active' | 'failed' | 'unloading' | null
}

/** One agent preset's identity and flattened composition in the inventory. */
export interface AgentPresetPluginGroup {
  readonly id: string
  readonly trust: 'system' | 'user'
  readonly name?: string
  readonly isDefault: boolean
  readonly broken?: string
  readonly rows: readonly AgentPresetPluginRow[]
}

/** Point-in-time inventory returned by the plugin inventory Remote. */
export interface PluginInventorySnapshot {
  readonly entries: readonly PluginInventoryEntry[]
  readonly agentPresets?: readonly AgentPresetPluginGroup[]
}

/** The remote faces the studio consumes (mounted by dsh-api-remotes). */
export interface PresetStudioRemote {
  readonly agentPresets: {
    list(): Promise<RemoteResult<AgentPresetRoster>>
    read(agentPreset: string): Promise<RemoteResult<AgentPresetDocument>>
    copy(from: string, id: string, name?: string): Promise<RemoteResult<void>>
    deletePreset(id: string): Promise<RemoteResult<void>>
  }
  readonly pluginInventory: {
    list(): Promise<RemoteResult<PluginInventorySnapshot>>
  }
  readonly settings: {
    openAgentPresetDirectory(agentPreset: string): Promise<RemoteResult<AgentPresetDirectoryOpenValue>>
  }
  /** Forwarded event subscription (settings invalidation, reconnects). */
  $on(event: string, listener: (payload: string) => void): () => void
}

/**
 * Resolve the remote hub off the client context.
 *
 * The `remote` service is mounted by `@deepseek-ai/dsh-api-remotes` (part of
 * the official web profile). This accessor is deliberately untyped at the
 * context boundary: the official Context merge declares `remote: ClientRemote`
 * from a package that lags the published registry, so the studio names its
 * own face instead of conflicting with that augmentation.
 * @param ctx - the client plugin context.
 * @returns the typed remote faces; throws when the remotes assembly is absent.
 */
export function presetStudioRemote(ctx: Context): PresetStudioRemote {
  const hub = (ctx as unknown as { remote?: PresetStudioRemote }).remote
  if (hub === undefined) {
    throw new Error(
      'preset-studio: ctx.remote unavailable — compose @deepseek-ai/dsh-api-remotes in the web profile',
    )
  }
  return hub
}
