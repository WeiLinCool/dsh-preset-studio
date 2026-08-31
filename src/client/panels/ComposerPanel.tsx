/**
 * Composition YAML editor: the working draft with live validation, export
 * actions (download / clipboard), and the copy-as-new entry. The Host never
 * receives composition text — the seam is deliberate — so exporting is the
 * save gesture, and the panel says so.
 */
import { useState } from 'react'
import yaml from 'js-yaml'
import { Button, IconCheckOutline16, IconCopyOutline16, IconDownloadOutline16, writeClipboard } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PresetStudioState } from '../controller.ts'
import type { AgentPresetRow } from '../wire.ts'
import css from '../presetstudio.module.css'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { PresetStudioKey } from '../locales.ts'

export interface ComposerActions {
  setDraft: (text: string) => void
  beginCopy: (from: string) => void
}

interface ComposerPanelProps {
  state: PresetStudioState
  row: AgentPresetRow | undefined
  actions: ComposerActions
  t: Translate<PresetStudioKey>
}

/** Trigger a browser download of one text file. */
function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/** The preset.yml the selected preset would publish from its display text. */
function metadataYaml(row: AgentPresetRow | undefined): string | undefined {
  if (row === undefined) return undefined
  const fields: Record<string, string> = {}
  if (row.name !== undefined && row.name !== row.id) fields.name = row.name
  if (row.description !== undefined && row.description.trim() !== '') fields.description = row.description
  if (Object.keys(fields).length === 0) return undefined
  return yaml.dump(fields, { lineWidth: -1 })
}

/**
 * Render the composer view.
 * @param props - the page state, the selected roster row, actions, copy.
 * @returns the editor, its action bar, and the validation side panel.
 */
export function ComposerPanel({ state, row, actions, t }: ComposerPanelProps) {
  const [copied, setCopied] = useState(false)
  const diagnostics = state.validation?.diagnostics ?? []
  const errors = diagnostics.filter(item => item.severity === 'error')
  const warnings = diagnostics.filter(item => item.severity === 'warning')
  const meta = metadataYaml(row)

  const copyText = async (): Promise<void> => {
    await writeClipboard(state.draft)
    setCopied(true)
    window.setTimeout(() => { setCopied(false) }, 1600)
  }

  return (
    <div className={css.composer}>
      <div className={css.editorBox}>
        {state.selectedTrust === 'system'
          ? <p className={css.banner}>{t('composer.readonly')}</p>
          : null}
        {state.dirty
          ? <p className={`${css.banner} ${css.bannerDirty}`}>{t('composer.dirty')}</p>
          : null}
        <textarea
          className={css.editor}
          value={state.draft}
          spellCheck={false}
          aria-label={t('composer.title')}
          onChange={(event) => { actions.setDraft(event.target.value) }}
        />
        <div className={css.actions}>
          <Button
            variant="outline"
            disabled={!state.dirty}
            onClick={() => { actions.setDraft(state.content) }}
          >
            {t('composer.reset')}
          </Button>
          <Button variant="outline" onClick={() => { void copyText() }}>
            {copied ? <IconCheckOutline16 size={14} /> : <IconCopyOutline16 size={14} />}
            {copied ? t('composer.copied') : t('composer.copyText')}
          </Button>
          <Button onClick={() => { downloadText('agent.cordis.yml', state.draft) }}>
            <IconDownloadOutline16 size={14} />
            {t('composer.download')}
          </Button>
          {meta === undefined
            ? null
            : (
              <Button variant="outline" onClick={() => { downloadText('preset.yml', meta) }}>
                <IconDownloadOutline16 size={14} />
                {t('composer.downloadMeta')}
              </Button>
            )}
          {state.selectedId === null
            ? null
            : (
              <Button variant="outline" onClick={() => { actions.beginCopy(state.selectedId ?? '') }}>
                {t('composer.copyAsNew')}
              </Button>
            )}
        </div>
      </div>
      <div className={css.side}>
        <div className={css.sideCard}>
          <h3 className={css.railHead}>{t('validation.title')}</h3>
          {state.validation === null
            ? <p className={css.diag}>{t('graph.empty')}</p>
            : diagnostics.length === 0 && state.validation.parseable
              ? <p className={`${css.diag} ${css.diagClean}`}>{t('validation.clean')}</p>
              : null}
          {state.validation?.parseable === false
            ? <p className={`${css.diag} ${css.diagError}`}>{state.validation.problem ?? '—'}</p>
            : null}
          {errors.length > 0 ? <p className={css.diagError}>{errors.length} {t('validation.errorCount')}</p> : null}
          {warnings.length > 0 ? <p className={css.diag}>{warnings.length} {t('validation.warningCount')}</p> : null}
          {diagnostics.map((item, index) => (
            <p key={index} className={item.severity === 'error' ? `${css.diag} ${css.diagError}` : css.diag}>
              {item.index === undefined ? null : <span className={css.diagIndex}>[{item.index}] </span>}
              {item.message}
            </p>
          ))}
        </div>
        <div className={css.sideCard}>
          <h3 className={css.railHead}>{t('composer.exportPath')}</h3>
          <p className={css.railHint}>{t('composer.exportPathHint')}</p>
        </div>
        <div className={css.sideCard}>
          <h3 className={css.railHead}>{t('composer.metadataFile')}</h3>
          {meta === undefined
            ? <p className={css.railHint}>{t('composer.metadataEmpty')}</p>
            : <pre className={css.pre}>{meta}</pre>}
        </div>
      </div>
    </div>
  )
}
