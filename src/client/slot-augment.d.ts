/**
 * Local compile-time view of the DSH web slot surface this plugin mounts
 * into: `conversation.hero.actions` (hero row beside the workspace / preset
 * controls), `conversation.session.header.actions` (active-session header next
 * to the preset label), and `shell.overlay` (frame-wide floating layer). The
 * standalone plugin repo does not install the
 * `@deepseek-ai/dsh-client-ui-conversation` / `@deepseek-ai/dsh-client-ui-layout`
 * packages (they ship with the dsh web shell), so the SlotMap rows are
 * restated here for type-checking only. The runtime contract is still
 * enforced by the shell's real SlotMap; this file contains only type
 * declarations and is erased from the built bundle.
 */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * Additive hero-row entries beside the workspace picker and the agent
     * preset selector, above the composer card.
     */
    'conversation.hero.actions': {
      kind: 'list'
      scope: 'root'
    }
    /**
     * Ordered actions in the active-session header (the agent-preset label
     * lives here with order -10).
     */
    'conversation.session.header.actions': {
      kind: 'list'
      scope: 'session'
      owner: { children?: never }
    }
    /**
     * Frame-wide floating layer above every column (additive list). Entries
     * opt back into pointer events via the layer's child rule.
     */
    'shell.overlay': {
      kind: 'list'
      scope: 'root'
    }
  }
}
