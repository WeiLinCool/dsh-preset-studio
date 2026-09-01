/**
 * Home surfaces for the Preset Studio.
 *
 * The launcher rides two additive slots so it sits beside the agent-preset UI
 * wherever that UI lives:
 * - `conversation.hero.actions`: the new-session hero row, right next to the
 *   workspace picker and the "梁神模式" preset selector;
 * - `conversation.session.header.actions`: an active session's header, next to
 *   the read-only preset label (order -9, right after the agent-preset label's
 *   -10).
 * It opens the studio as a full-frame surface via `shell.overlay` — a
 * dedicated page, not the narrow settings dialog.
 */
import { useEffect } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { PresetStudioBody, type PresetStudioSectionInjected } from './PresetStudioSection.tsx'
import css from './presetstudio.module.css'

/** Props the hero launcher receives (standard slot kit + controller face). */
export type HomePresetStudioButtonProps =
  PropsRuntime<'conversation.hero.actions'>
  & PropsLocale<'preset-studio'>
  & InjectFace<PresetStudioSectionInjected>

/** Props the active-session header launcher receives. */
export type HomePresetStudioHeaderButtonProps =
  PropsRuntime<'conversation.session.header.actions'>
  & PropsLocale<'preset-studio'>
  & InjectFace<PresetStudioSectionInjected>

/** The launcher button, shared by the hero row and the session header. */
function StudioLaunchButton({
  open, t, actions, compact = false,
}: {
  readonly open: boolean
  readonly t: HomePresetStudioButtonProps['t']
  readonly actions: PresetStudioSectionInjected['actions']
  readonly compact?: boolean
}) {
  if (open) return null
  return (
    <button
      type="button"
      className={compact ? `${css.homeButton} ${css.homeButtonCompact}` : css.homeButton}
      onClick={() => { actions.openHome() }}
    >
      <span className={css.homeButtonGlyph} aria-hidden="true" />
      <span>{t('home.button')}</span>
    </button>
  )
}

/**
 * The hero-row launcher, beside the workspace / agent-preset controls.
 */
export function HomePresetStudioButton(props: HomePresetStudioButtonProps) {
  const { usePresetStudio, t, actions } = props
  const open = usePresetStudio(snapshot => snapshot.homeOpen)
  return <StudioLaunchButton open={open} t={t} actions={actions} />
}

/**
 * The active-session header launcher, beside the agent-preset label.
 */
export function HomePresetStudioHeaderButton(props: HomePresetStudioHeaderButtonProps) {
  const { usePresetStudio, t, actions } = props
  const open = usePresetStudio(snapshot => snapshot.homeOpen)
  return <StudioLaunchButton open={open} t={t} actions={actions} compact />
}

/** Props the full-page overlay entry receives (standard slot kit + controller face). */
export type PresetStudioPageProps =
  PropsRuntime<'shell.overlay'>
  & PropsLocale<'preset-studio'>
  & InjectFace<PresetStudioSectionInjected>

/**
 * The full-frame studio surface. Closed renders nothing (the overlay entry
 * stays mounted); open it covers the app with the shared studio body and a
 * header carrying a close affordance.
 */
export function PresetStudioPage(props: PresetStudioPageProps) {
  const { usePresetStudio, t, actions } = props
  const open = usePresetStudio(snapshot => snapshot.homeOpen)

  // Escape closes the page; the listener only exists while it is open.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') actions.closeHome()
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [open, actions])

  if (!open) return null
  return (
    <div
      className={css.pageOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('page.title')}
      data-preset-studio-page=""
    >
      <header className={css.pageHeader}>
        <h2 className={css.pageTitle}>{t('page.title')}</h2>
        <button
          type="button"
          className={css.pageClose}
          aria-label={t('close')}
          onClick={() => { actions.closeHome() }}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className={css.pageBody}>
        <PresetStudioBody usePresetStudio={usePresetStudio} t={t} actions={actions} />
      </div>
    </div>
  )
}
