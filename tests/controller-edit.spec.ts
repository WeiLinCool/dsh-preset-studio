/**
 * Controller positioned-insert tests: the canvas add-node menu actions land
 * in the working draft right after the anchor (or inside a group), so the
 * graph the user sees reflects the insert.
 */
import { describe, expect, it } from 'vitest'
import { PresetStudioController } from '../src/client/controller.ts'
import type { PresetStudioRemote } from '../src/client/wire.ts'
import { MINI_COMPOSITION } from './fixtures.ts'

const remote: PresetStudioRemote = {
  agentPresets: {
    list: async () => ({ ok: true, value: { presets: [{ id: 'mini', trust: 'user', isDefault: true }], authorable: true } }),
    read: async () => ({ ok: true, value: { agentPreset: 'mini', trust: 'user', content: MINI_COMPOSITION } }),
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

describe('PresetStudioController positioned inserts', () => {
  it('inserts a row right after the anchor row', async () => {
    const controller = new PresetStudioController(remote)
    await controller.load()
    controller.addRowAfter('r2', `- id: tool-todo\n  name: '@deepseek-ai/dsh-tool-todo'\n`)
    const snapshot = controller.getSnapshot()
    expect(snapshot.draft).toContain('id: tool-todo')
    const ids = (snapshot.graph?.nodes ?? []).map(node => node.rowId)
    expect(ids.indexOf('tool-todo')).toBe(ids.indexOf('tool-bash') + 1)
  })

  it('inserts a row inside a group when asked', async () => {
    const controller = new PresetStudioController(remote)
    await controller.load()
    controller.addRowToGroup('r5', `- id: tool-fs\n  name: '@deepseek-ai/dsh-tool-fs'\n`)
    const node = controller.getSnapshot().graph?.nodes.find(candidate => candidate.rowId === 'tool-fs')
    expect(node).toBeDefined()
    expect(node?.parentId).toBe('r5')
  })
})
