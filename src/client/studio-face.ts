/**
 * Shared registrant face for every Preset Studio surface: the controller's
 * store and actions bound once, used by the home launchers and the full-page
 * overlay so they all share one snapshot and never diverge.
 */
import type { PresetStudioSectionInjected } from './PresetStudioSection.tsx'
import type { PresetStudioController } from './controller.ts'

/**
 * Build the registrant face binding the controller's store and actions.
 * @param controller - the studio controller.
 * @returns the inject factory the slot registrations pass.
 */
export function createPresetStudioFace(controller: PresetStudioController): () => PresetStudioSectionInjected {
  return () => ({
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
      openHome: () => { controller.openHome() },
      closeHome: () => { controller.closeHome() },
    },
  })
}
