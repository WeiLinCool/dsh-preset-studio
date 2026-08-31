/**
 * Settings-section registration for the Preset Studio.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { PresetStudioSection, type PresetStudioSectionInjected } from './PresetStudioSection.tsx'
import type { PresetStudioController } from './controller.ts'

/** Stable id of the studio settings section entry. */
export const PRESET_STUDIO_SECTION_ID = 'preset-studio'

/**
 * Register the studio as a settings section.
 * @param ctx - client root context.
 * @param controller - the studio controller driving the section.
 * @param label - localized nav label.
 * @returns disposer unregistering the section.
 */
export function mountSection(ctx: ClientContext, controller: PresetStudioController, label: () => string): () => void {
  const injected = (): PresetStudioSectionInjected => ({
    hooks: { presetStudio: controller.store },
    actions: {
      load: () => controller.load(),
      selectPreset: (id: string) => controller.selectPreset(id),
      setView: (view) => { controller.setView(view) },
      setDraft: (text: string) => { controller.setDraft(text) },
      selectNode: (id: string | null) => { controller.selectNode(id) },
      applyRowConfig: (nodeId: string, path: string, value: unknown) => controller.applyRowConfig(nodeId, path, value),
      removeRow: (nodeId: string) => controller.removeRow(nodeId),
      addRow: (block: string) => { controller.addRow(block) },
      beginCopy: (from: string) => { controller.beginCopy(from) },
      cancelCopy: () => { controller.cancelCopy() },
      setCopyId: (id: string) => { controller.setCopyId(id) },
      setCopyName: (name: string) => { controller.setCopyName(name) },
      confirmCopy: () => controller.confirmCopy(),
      confirmDelete: (id: string | null) => { controller.confirmDelete(id) },
      remove: () => controller.remove(),
      setDiffSide: (side: 'left' | 'right', id: string | null) => controller.setDiffSide(side, id),
      openPresetLocation: (id: string) => controller.openPresetLocation(id),
    },
  })
  return ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: PRESET_STUDIO_SECTION_ID,
    order: 30,
    label,
    locale: 'preset-studio',
    inject: injected,
  }, PresetStudioSection))
}
