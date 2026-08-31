/**
 * Host loader entry for the preset-studio plugin — runs in the DSH host
 * process.
 *
 * The host half owns the plugin's settings namespace (`preset-studio`: enabled
 * / announceToAgent / defaultView) and a system-prompt section announcing the
 * plugin to every agent. The actual UI lives in the browser half
 * (src/client), which reads the same namespace through the settings scope.
 * The browser half reads the real agent-preset roster and plugin inventory
 * over the wire (`remote.agentPresets` / `remote.pluginInventory`) and
 * projects each composition into Harness Graph nodes — no mock data.
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
// Type-only: pulls the settings provider's Context merge (ctx.settings).
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type { StudioView } from './core/types.ts'

export type { StudioView }

/** Order of the announcement section within the tool-guidance band. */
const SECTION_ORDER = 220

export const inject = ['systemPrompt']

/** Model-facing announcement: plugin presence, capabilities, and limits. */
export const PRESET_STUDIO_GUIDANCE = '本机已安装 dsh-preset-studio 插件（DSH Web GUI 的 agent preset 可视化编辑器，设置 → Preset Studio）：把真实 preset 组合（agent.cordis.yml）投影为 Harness Graph DAG——节点=组合行（persona/tool/skill/group 等 Runtime Capability），边=顺序(data)/归属(lifecycle)/服务依赖(service)，event 与 context 边为运行期保留；内置插件注册表为常见行提供 JSON Schema 配置表单；支持组合 YAML 编辑与校验、预设差异对比、下载导出。用户提到「Preset Studio / 预设编辑器 / Harness Graph」时即指本插件，请据此协作。'

/** Settings namespace of the plugin's configuration — the section the web settings surface edits. */
export const PRESET_STUDIO_SETTINGS_NAMESPACE = 'preset-studio'

/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
  /** Master switch for the plugin (browser half + host announcement). */
  enabled?: boolean
  /** When true (default), a system-prompt section announces the plugin to every agent. */
  announceToAgent?: boolean
  /** View the studio section opens on. */
  defaultView?: StudioView
}

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  announceToAgent: z.boolean().default(true),
  defaultView: z.union([z.const('graph' as const), z.const('yaml' as const), z.const('diff' as const)]).default('graph'),
})

/** Schema default, re-read for hand-built test contexts (the loader applies them normally). */
const DEFAULT_ANNOUNCE = true

/**
 * Register the plugin's announcement section, gated on the composition entry's
 * `enabled` / `announceToAgent` (and the live settings value once the web
 * settings surface is served). The section is re-registered whenever the
 * source changes, so a settings edit takes effect without a restart.
 * @param ctx - the plugin context (systemPrompt injected).
 * @param config - resolved plugin config (schema defaults applied by the loader).
 */
export function apply(ctx: Context, config?: Config): void {
  let current: () => Config = () => config ?? {}
  let disposeSection: (() => void) | undefined

  const sync = (): void => {
    if (disposeSection !== undefined) {
      disposeSection()
      disposeSection = undefined
    }
    if ((current().enabled ?? true) === false) return
    if ((current().announceToAgent ?? DEFAULT_ANNOUNCE) === false) return
    disposeSection = ctx.systemPrompt.section({
      name: 'plugin:preset-studio',
      order: SECTION_ORDER,
      text: PRESET_STUDIO_GUIDANCE,
    })
  }

  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, PRESET_STUDIO_SETTINGS_NAMESPACE, Config, config ?? {}, {
      setSource: (source) => { current = source },
      onChange: sync,
    })
  })

  // Initial registration from the composition entry (covers deployments with
  // no settings service, whose installSection never fires its hooks).
  sync()
}
