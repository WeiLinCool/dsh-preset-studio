/** Apply guard: exactly one studio section may mount per page lifetime. */

let applied = false

/** Claim the single client application slot. @returns false when taken. */
export function claimPresetStudioApply(): boolean {
  if (applied) return false
  applied = true
  return true
}

/** Release the claim (fiber unload / hot-reload). */
export function releasePresetStudioApply(): void {
  applied = false
}
