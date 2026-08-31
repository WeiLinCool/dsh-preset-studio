/**
 * The preset-studio settings card: enablement, agent announcement, initial
 * view. Registers into the `settings.plugin.item` slot the plugin
 * configuration section renders, bound to the `preset-studio` settings
 * namespace.
 */

import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { StudioView } from '../core/types.ts'
import { PluginSettingsCard, BooleanField, ChoiceField } from './PluginSettingsCard.tsx'
import { CardForm, booleanField, choiceField, type CardActions, type CardShell, type FieldState as CardFieldState } from './settings-form.ts'

/** The preset-studio fields this card edits (the namespace's full schema). */
export interface PresetStudioSettings {
  /** Master switch for the plugin. */
  enabled?: boolean
  /** Whether the plugin announces itself in every agent's system prompt. */
  announceToAgent?: boolean
  /** View the studio section opens on. */
  defaultView?: StudioView
}

/** What the preset-studio card renders. */
export interface PresetStudioSettingsCardState extends CardShell {
  /** Master switch. */
  enabled: CardFieldState
  /** System-prompt announcement flag. */
  announceToAgent: CardFieldState
  /** Initial studio view. */
  defaultView: CardFieldState
}

/** The registration-side face the card's slot entry injects. */
export interface PresetStudioSettingsCardFace extends CardActions {
  hooks: {
    /** Card snapshot bound by the renderer as usePresetStudioSettingsCard. */
    presetStudioSettingsCard: SnapshotStore<PresetStudioSettingsCardState>
  }
}

/** Bridges the `preset-studio` scope onto the card's staged form. */
export class PresetStudioSettingsCardController {
  private readonly form: CardForm<PresetStudioSettings>
  private readonly store: SnapshotStore<PresetStudioSettingsCardState>

  /** @param scope - the bound settings scope for the `preset-studio` namespace. */
  constructor(scope: SettingsScope<PresetStudioSettings>) {
    this.form = new CardForm(scope, [
      booleanField('enabled'),
      booleanField('announceToAgent'),
      choiceField('defaultView', ['graph', 'yaml', 'diff']),
    ])
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): PresetStudioSettingsCardState {
    return {
      ...this.form.shell(),
      enabled: this.form.field('enabled'),
      announceToAgent: this.form.field('announceToAgent'),
      defaultView: this.form.field('defaultView'),
    }
  }

  /**
   * Build the face the card's slot registration injects.
   * @returns the card's snapshot and its form actions.
   */
  inject(): PresetStudioSettingsCardFace {
    return { hooks: { presetStudioSettingsCard: this.store }, ...this.form.actions() }
  }
}

/** Props the renderer binds for the preset-studio card. */
export type PresetStudioSettingsCardProps =
  PropsRuntime<'settings.plugin.item'>
  & PropsLocale<'preset-studio'>
  & InjectFace<PresetStudioSettingsCardFace>

/**
 * Render the preset-studio card.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the card.
 */
export function PresetStudioSettingsCard(props: PresetStudioSettingsCardProps) {
  const { t } = props
  const state = props.usePresetStudioSettingsCard(snapshot => snapshot)
  const disabled = !state.writable
  const fieldProps = {
    overriddenLabel: t('settings.overridden'),
    resetLabel: t('settings.reset'),
    invalidLabel: t('settings.invalidNumber'),
    disabled,
  }
  return (
    <PluginSettingsCard
      t={t}
      titleKey="settings.title"
      descriptionKey="settings.description"
      state={state}
      onSave={props.save}
      onDiscard={props.discard}
    >
      <BooleanField
        id="settings-preset-studio-enabled"
        label={t('settings.enabled')}
        hint={t('settings.enabledHint')}
        inheritLabel={t('settings.inherit')}
        onLabel={t('settings.on')}
        offLabel={t('settings.off')}
        {...fieldProps}
        {...state.enabled}
        onEdit={(text) => { props.edit('enabled', text) }}
        onReset={() => { props.resetField('enabled') }}
      />
      <BooleanField
        id="settings-preset-studio-announce"
        label={t('settings.announceToAgent')}
        hint={t('settings.announceToAgentHint')}
        inheritLabel={t('settings.inherit')}
        onLabel={t('settings.on')}
        offLabel={t('settings.off')}
        {...fieldProps}
        {...state.announceToAgent}
        onEdit={(text) => { props.edit('announceToAgent', text) }}
        onReset={() => { props.resetField('announceToAgent') }}
      />
      <ChoiceField
        id="settings-preset-studio-default-view"
        label={t('settings.defaultView')}
        hint={t('settings.defaultViewHint')}
        inheritLabel={t('settings.inherit')}
        options={[
          { value: 'graph', label: t('settings.choice.viewGraph') },
          { value: 'yaml', label: t('settings.choice.viewYaml') },
          { value: 'diff', label: t('settings.choice.viewDiff') },
        ]}
        {...fieldProps}
        {...state.defaultView}
        onEdit={(text) => { props.edit('defaultView', text) }}
        onReset={() => { props.resetField('defaultView') }}
      />
    </PluginSettingsCard>
  )
}
