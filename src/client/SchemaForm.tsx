/**
 * Schema-driven config form (spec §七): renders the form fields derived from
 * a curated JSON Schema and writes each edit straight into the working draft
 * through row surgery. Numbers with a range become sliders, booleans become
 * switches, enums become selects.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { fieldsFromSchema, type FormField } from '../core/schema-form.ts'
import type { HarnessNode, JsonObjectSchema } from '../core/types.ts'
import { getPath } from '../core/edit.ts'
import css from './presetstudio.module.css'

export interface SchemaFormActions {
  applyRowConfig: (nodeId: string, path: string, value: unknown) => boolean
}

interface SchemaFormProps {
  schema: JsonObjectSchema | undefined
  node: HarnessNode
  actions: SchemaFormActions
}

/** One text-ish field: local draft, committed on blur (avoids cursor jumps). */
function TextField({
  kind, path, node, actions, value, placeholder,
}: {
  kind: 'text' | 'number' | 'textarea'
  path: string
  node: HarnessNode
  actions: SchemaFormActions
  value: string
  placeholder?: string
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { setDraft(value) }, [value])
  const commit = (): void => {
    if (draft === value) return
    const next = kind === 'number' ? Number(draft) : draft
    if (kind === 'number' && (draft.trim() === '' || !Number.isFinite(next))) {
      setDraft(value)
      return
    }
    actions.applyRowConfig(node.id, path, kind === 'number' ? next : draft)
  }
  if (kind === 'textarea') {
    return (
      <textarea
        className={`${css.textInput} ${css.textArea}`}
        value={draft}
        spellCheck={false}
        placeholder={placeholder}
        onChange={(event) => { setDraft(event.target.value) }}
        onBlur={commit}
      />
    )
  }
  return (
    <input
      className={css.textInput}
      type={kind === 'number' ? 'number' : 'text'}
      value={draft}
      spellCheck={false}
      placeholder={placeholder}
      onChange={(event) => { setDraft(event.target.value) }}
      onBlur={commit}
    />
  )
}

/** One field row (label + hint + control). */
function FieldRow({ field, path, node, actions }: {
  field: FormField
  path: string
  node: HarnessNode
  actions: SchemaFormActions
}): ReactNode {
  const raw = getPath(node.config, path)
  const value = raw === undefined ? field.defaultValue : raw
  switch (field.kind) {
    case 'boolean':
      return (
        <label className={css.checkRow}>
          <input
            type="checkbox"
            checked={value === true}
            onChange={(event) => { actions.applyRowConfig(node.id, path, event.target.checked) }}
          />
          <span className={css.checkLabel}>{field.title}</span>
        </label>
      )
    case 'enum':
      return (
        <div className={css.field}>
          <span className={css.fieldLabel}>{field.title}</span>
          {field.description === undefined ? null : <span className={css.fieldHint}>{field.description}</span>}
          <select
            className={css.selectInput}
            value={String(value ?? '')}
            onChange={(event) => { actions.applyRowConfig(node.id, path, event.target.value) }}
          >
            {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      )
    case 'slider': {
      const min = field.min ?? 0
      const max = field.max ?? 100
      const numeric = typeof value === 'number' && Number.isFinite(value) ? value : min
      return (
        <div className={css.field}>
          <span className={css.fieldLabel}>{field.title}</span>
          {field.description === undefined ? null : <span className={css.fieldHint}>{field.description}</span>}
          <div className={css.sliderRow}>
            <input
              className={css.slider}
              type="range"
              min={min}
              max={max}
              step={1}
              value={numeric}
              onChange={(event) => { actions.applyRowConfig(node.id, path, Number(event.target.value)) }}
            />
            <span className={css.sliderValue}>{numeric}</span>
          </div>
        </div>
      )
    }
    default:
      return (
        <div className={css.field}>
          <span className={css.fieldLabel}>{field.title}</span>
          {field.description === undefined ? null : <span className={css.fieldHint}>{field.description}</span>}
          <TextField
            kind={field.kind === 'number' ? 'number' : field.kind === 'textarea' ? 'textarea' : 'text'}
            path={path}
            node={node}
            actions={actions}
            value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
            placeholder={typeof field.defaultValue === 'string' || typeof field.defaultValue === 'number' ? String(field.defaultValue) : undefined}
          />
        </div>
      )
  }
}

/**
 * Render the generated config form for one node.
 * @param props - the curated schema, the node, and the draft-write actions.
 * @returns the form, or nothing when the schema defines no fields.
 */
export function SchemaForm({ schema, node, actions }: SchemaFormProps) {
  const fields = fieldsFromSchema(schema)
  if (fields.length === 0) return null
  return (
    <div>
      {fields.map(field => (
        <div key={field.key}>
          {field.nested === undefined || field.nested.length === 0
            ? <FieldRow field={field} path={field.key} node={node} actions={actions} />
            : (
              <div className={css.field}>
                <span className={css.fieldLabel}>{field.title}</span>
                {field.nested.map(child => (
                  <FieldRow key={child.key} field={child} path={`${field.key}.${child.key}`} node={node} actions={actions} />
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  )
}
