/**
 * Schema-driven form model (spec §七): a curated JSON Schema becomes editable
 * form fields — numbers with a range become sliders, booleans become switches,
 * enums become selects. The UI layer renders these descriptors; nothing here
 * imports React.
 * @module @tieveto666-code/dsh-preset-studio/src/core/schema-form
 */

import type { JsonObjectSchema, JsonSchemaProperty } from './types.ts'

/** How one field is edited. */
export type FormFieldKind = 'text' | 'textarea' | 'number' | 'slider' | 'boolean' | 'enum'

/** One editable field the form renders. */
export interface FormField {
  /** Property key inside the row config. */
  readonly key: string
  /** Human label (schema title, else the key). */
  readonly title: string
  /** Editing control. */
  readonly kind: FormFieldKind
  /** One-sentence hint from the schema description. */
  readonly description?: string
  /** Numeric bounds for number/slider fields. */
  readonly min?: number
  readonly max?: number
  /** Schema default, when one is declared. */
  readonly defaultValue?: unknown
  /** Allowed values for enum fields. */
  readonly options?: readonly string[]
  /** Nested object fields, flattened with dotted keys. */
  readonly nested?: readonly FormField[]
}

/**
 * Classify one property into a field kind.
 * @param property - the schema property.
 * @returns the editing control.
 */
function kindOf(property: JsonSchemaProperty): FormFieldKind {
  if (property.type === 'boolean') return 'boolean'
  if (property.enum !== undefined && property.enum.length > 0) return 'enum'
  if (property.type === 'number' || property.type === 'integer') {
    if (property.minimum !== undefined && property.maximum !== undefined) return 'slider'
    return 'number'
  }
  if (property.type === 'string') return 'text'
  return 'text'
}

/** A property whose value is a scalar the form can edit. */
function isScalar(property: JsonSchemaProperty): boolean {
  return property.type === undefined
    || property.type === 'string'
    || property.type === 'number'
    || property.type === 'integer'
    || property.type === 'boolean'
    || (property.enum !== undefined && property.enum.length > 0)
}

/**
 * Derive editable form fields from a config schema.
 * @param schema - the curated object schema; non-object roots yield no fields.
 * @returns the fields, nested properties flattened with dotted keys.
 */
export function fieldsFromSchema(schema: JsonObjectSchema | undefined): FormField[] {
  if (schema === undefined || schema.properties === undefined) return []
  const out: FormField[] = []
  for (const [key, property] of Object.entries(schema.properties)) {
    const nested = property.properties === undefined ? [] : Object.entries(property.properties).map(([childKey, child]) => ({
      key: childKey,
      title: child.title ?? childKey,
      kind: kindOf(child),
      ...child.description === undefined ? {} : { description: child.description },
      ...child.minimum === undefined ? {} : { min: child.minimum },
      ...child.maximum === undefined ? {} : { max: child.maximum },
      ...child.default === undefined ? {} : { defaultValue: child.default },
      ...child.enum === undefined ? {} : { options: child.enum.map(String) },
    }))
    out.push({
      key,
      title: property.title ?? key,
      kind: isScalar(property) ? kindOf(property) : 'textarea',
      ...property.description === undefined ? {} : { description: property.description },
      ...property.minimum === undefined ? {} : { min: property.minimum },
      ...property.maximum === undefined ? {} : { max: property.maximum },
      ...property.default === undefined ? {} : { defaultValue: property.default },
      ...property.enum === undefined ? {} : { options: property.enum.map(String) },
      ...nested.length === 0 ? {} : { nested },
    })
  }
  return out
}

/**
 * The config a fresh row starts from: every schema default, nothing invented.
 * @param schema - the curated schema.
 * @returns a plain config object.
 */
export function exampleConfig(schema: JsonObjectSchema | undefined): Record<string, unknown> {
  if (schema === undefined || schema.properties === undefined) return {}
  const out: Record<string, unknown> = {}
  for (const [key, property] of Object.entries(schema.properties)) {
    if (property.default !== undefined) out[key] = property.default
  }
  return out
}
