/**
 * Controller home-surface state: the full-page overlay open flag.
 */
import { describe, expect, it } from 'vitest'
import { PresetStudioController } from '../src/client/controller.ts'
import type { PresetStudioRemote } from '../src/client/wire.ts'

/** Minimal remote: the home-state tests never touch the wire. */
const remote: PresetStudioRemote = {
  agentPresets: {
    list: async () => ({ ok: true, value: { presets: [], authorable: false } }),
    read: async () => ({ ok: false, error: { code: 'unused', message: 'unused' } }),
    copy: async () => ({ ok: true, value: undefined }),
    deletePreset: async () => ({ ok: true, value: undefined }),
  },
  pluginInventory: {
    list: async () => ({ ok: true, value: { entries: [] } }),
  },
  settings: {
    openAgentPresetDirectory: async () => ({ ok: true, value: { opened: true } }),
  },
  $on: () => () => {},
}

describe('PresetStudioController home surface', () => {
  it('starts closed and toggles through openHome / closeHome', () => {
    const controller = new PresetStudioController(remote)
    expect(controller.getSnapshot().homeOpen).toBe(false)
    controller.openHome()
    expect(controller.getSnapshot().homeOpen).toBe(true)
    controller.closeHome()
    expect(controller.getSnapshot().homeOpen).toBe(false)
  })
})
