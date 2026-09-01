/**
 * Home-surface registration for the Preset Studio: hero-row and session-header
 * launchers (both beside the agent-preset UI) plus the full-frame studio page.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import {
  HomePresetStudioButton, HomePresetStudioHeaderButton, PresetStudioPage,
} from './PresetStudioHome.tsx'
import { createPresetStudioFace } from './studio-face.ts'
import type { PresetStudioController } from './controller.ts'

/** Stable id of the hero-row launcher entry. */
export const PRESET_STUDIO_HOME_ID = 'preset-studio-home'

/** Stable id of the active-session header launcher entry. */
export const PRESET_STUDIO_HEADER_ID = 'preset-studio-launch'

/** Stable id of the full-page overlay entry. */
export const PRESET_STUDIO_PAGE_ID = 'preset-studio-page'

/**
 * Register the launchers and the full-page studio surface.
 * @param ctx - client root context.
 * @param controller - the studio controller shared with the settings section.
 * @returns disposer unregistering all entries.
 */
export function mountHome(ctx: ClientContext, controller: PresetStudioController): () => void {
  const injected = createPresetStudioFace(controller)
  const composable: Array<() => void> = [
    // New-session hero row: right beside the workspace / preset selector.
    ctx.slots.inject('conversation.hero.actions', () => ctx.slots.register({
      name: 'conversation.hero.actions',
      id: PRESET_STUDIO_HOME_ID,
      order: 10,
      locale: 'preset-studio',
      inject: injected,
    }, HomePresetStudioButton)),
    // Active session header: right after the agent-preset label (order -10).
    ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
      name: 'conversation.session.header.actions',
      id: PRESET_STUDIO_HEADER_ID,
      order: -9,
      locale: 'preset-studio',
      inject: injected,
    }, HomePresetStudioHeaderButton)),
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
      name: 'shell.overlay',
      id: PRESET_STUDIO_PAGE_ID,
      order: 100,
      locale: 'preset-studio',
      inject: injected,
    }, PresetStudioPage)),
  ]
  return () => {
    for (const dispose of composable.splice(0)) dispose()
  }
}
