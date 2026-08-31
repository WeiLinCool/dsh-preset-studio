/**
 * Preset Studio client plugin: wires the framework-free controller to the
 * real client runtime and mounts the settings section plus the official
 * settings card.
 *
 * Failure policy: DOM mounting problems are logged, never thrown — the web
 * shell fails the whole boot when a plugin apply throws, and an external
 * plugin must not take the GUI down.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the connection plugin's Events merge (connection/reset).
import type {} from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the locale plugin's Context merge (ctx.locale) and its
// LocaleNamespaceMap merge table.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings-surface Context merge (ctx.settingsScope).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'

// Type-only: pulls the SlotMap rows this plugin registers into
// (`settings.section` from ui-settings, `settings.plugin.item` from
// ui-settings-plugins) and the renderer's `ctx.slots` merge.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { PresetStudioController } from './controller.ts'
import { claimPresetStudioApply, releasePresetStudioApply } from './apply-guard.ts'
import { mountSection } from './mount-section.tsx'
import { PresetStudioSettingsCard, PresetStudioSettingsCardController, type PresetStudioSettings } from './PresetStudioSettingsCard.tsx'
import { en, zh, type PresetStudioKey } from './locales.ts'
import { presetStudioRemote } from './wire.ts'
// Side-effect import: injects the plugin-scoped ReactFlow base stylesheet.
import './reactflow-base.module.css'

/** Locale namespace this plugin owns. */
const NS = 'preset-studio'

/** Settings namespace the settings card edits (the Host plugin registers it). */
const PRESET_STUDIO_NS = 'preset-studio'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Preset Studio surface copy. */
    'preset-studio': PresetStudioKey
  }
}

/** Required services (fiber inject waiting — the runtime must be up first). */
export const inject = [
  'slots', 'connection', 'settingsScope', 'locale', 'remote',
  'remote.agentPresets', 'remote.pluginInventory', 'remote.settings',
]

/**
 * Mount the preset studio.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // A duplicated client injection (module factory executed twice in one page
  // lifetime) would otherwise mount a second section. First application
  // wins; later calls become no-ops (see apply-guard.ts).
  if (!claimPresetStudioApply()) return

  // Release the claim when this fiber unloads (the loader supports plugin
  // unloads / hot-reloads), so a rebuilt bundle can claim again in the same
  // page instead of being silently dropped.
  ctx.effect(() => releasePresetStudioApply, 'preset-studio: apply claim')

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'preset-studio: dictionaries')

  // Plugin configuration card: one staged form over the `preset-studio`
  // settings namespace, contributed to the official plugin configuration page.
  const settingsScope = ctx.settingsScope.bind<PresetStudioSettings>({ namespace: PRESET_STUDIO_NS })
  const settingsCard = new PresetStudioSettingsCardController(settingsScope)
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: 'preset-studio',
    locale: NS,
    inject: () => settingsCard.inject(),
  }, PresetStudioSettingsCard))

  const remote = presetStudioRemote(ctx)
  const viewLabel = ctx.locale.bind(NS)

  // The section mounts once the settings scope settles; while the scope is
  // still loading, the composition default is unknown, so nothing mounts
  // yet. Only an unavailable scope (no settings surface served) falls back
  // to the composition default (enabled).
  let uiDisposer: (() => void) | undefined
  let controller: PresetStudioController | undefined
  const mountUi = (): void => {
    if (uiDisposer !== undefined) return
    const snapshot = settingsScope.getSnapshot()
    const value = snapshot.status === 'ready' ? snapshot.value ?? {} : {}
    controller = new PresetStudioController(remote, { defaultView: value.defaultView })

    const disposers: Array<() => void> = []
    try {
      disposers.push(mountSection(ctx, controller, () => viewLabel('nav')))
    } catch (error) {
      // Surface failures degrade the section, never the GUI.
      console.error('[dsh-preset-studio] mount failed:', error)
    }

    // The roster is a live directory and the default preset is a settings
    // field; re-read on the two signals that can move it.
    const refresh = (): void => { void controller?.load() }
    const onSettings = (ns: string): void => {
      if (ns !== 'agent-presets' && ns !== PRESET_STUDIO_NS) return
      refresh()
    }
    const offSettings = remote.$on('settings/document-updated', onSettings)
    const offConnection = ctx.on('connection/reset', refresh)
    disposers.push(() => {
      offSettings()
      offConnection()
    })

    uiDisposer = () => {
      for (const dispose of disposers.splice(0)) dispose()
      controller = undefined
      uiDisposer = undefined
    }
  }
  const syncEnabled = (): void => {
    const snapshot = settingsScope.getSnapshot()
    const enabled = snapshot.status === 'ready'
      ? snapshot.value?.enabled ?? true
      : snapshot.status === 'unavailable'
    if (enabled) mountUi()
    else uiDisposer?.()
  }
  settingsScope.subscribe(syncEnabled)
  syncEnabled()
}
