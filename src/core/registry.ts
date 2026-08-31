/**
 * The bundled plugin registry: curated introspection knowledge about the
 * plugin rows the shipped presets and common compositions name.
 *
 * This is the Phase-1 stand-in for the full Plugin Introspection Engine
 * (spec §六): the Host does not expose per-plugin config schemas over the
 * wire, so the studio ships a catalog of well-known rows — their category,
 * their declarative provides/consumes (used to derive `service` edges), their
 * JSON Schema config (used by the schema-driven form), and the YAML fragment
 * the palette adds. Rows the catalog does not know are still rendered, just
 * with no schema form and no service edges.
 *
 * Config schemas only carry fields verified against the shipped presets; an
 * unknown field stays editable in the YAML view.
 * @module @tieveto666-code/dsh-preset-studio/src/core/registry
 */

import type { RegistryEntry } from './types.ts'



export const REGISTRY: readonly RegistryEntry[] = [
  {
    module: '@deepseek-ai/dsh-persona',
    kind: 'persona',
    label: 'Persona (人设)',
    description: 'The agent\'s identity text, shadowing the deployment default for this session.',
    provides: ['system-prompt'],
    consumes: [],
    configSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          title: 'Persona text',
          description: 'The identity prompt; {{model}} and {{cwd}} resolve from the agent\'s own route.',
        },
      },
    },
    template: `- id: persona\n  name: '@deepseek-ai/dsh-persona'\n  config:\n    text: >-\n      You are an agent running on the DeepSeek Harness.`,
  },
  {
    module: '@deepseek-ai/dsh-agent-instructions',
    kind: 'persona',
    label: 'Agent Instructions (指令注入)',
    description: 'Model-facing instructions injected into every agent context.',
    provides: ['system-prompt'],
    consumes: [],
    configSchema: {
      type: 'object',
      properties: {
        maxBytes: {
          type: 'integer',
          title: 'maxBytes',
          description: 'Byte cap of the instructions payload.',
          minimum: 0,
          maximum: 1048576,
          default: 65536,
        },
      },
    },
    template: `- id: agent-instructions\n  name: '@deepseek-ai/dsh-agent-instructions'\n  config:\n    maxBytes: 65536`,
  },
  {
    module: '@deepseek-ai/dsh-tool-bash',
    kind: 'tool',
    label: 'Bash Tool',
    description: 'Persistent shell tool executing bash commands.',
    provides: ['tools'],
    consumes: [],
    template: `- id: tool-bash\n  name: '@deepseek-ai/dsh-tool-bash'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-pwsh',
    kind: 'tool',
    label: 'PowerShell Tool',
    description: 'Persistent shell tool executing PowerShell commands.',
    provides: ['tools'],
    consumes: [],
    template: `- id: tool-pwsh\n  name: '@deepseek-ai/dsh-tool-pwsh'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-fs',
    kind: 'tool',
    label: 'Filesystem Tool',
    description: 'File read / write / edit tools over the session workspace.',
    provides: ['tools'],
    consumes: [],
    template: `- id: tool-fs\n  name: '@deepseek-ai/dsh-tool-fs'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-fs-search',
    kind: 'tool',
    label: 'Filesystem Search',
    description: 'Glob and grep search tools over the session workspace.',
    provides: ['tools'],
    consumes: [],
    configSchema: {
      type: 'object',
      properties: {
        sampleOverCapGlobResults: {
          type: 'boolean',
          title: 'sampleOverCapGlobResults',
          description: 'Sample oversized glob results instead of truncating.',
          default: false,
        },
      },
    },
    template: `- id: tool-fs-search\n  name: '@deepseek-ai/dsh-tool-fs-search'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-web',
    kind: 'tool',
    label: 'Web Tool',
    description: 'Web search and fetch tools.',
    provides: ['tools'],
    consumes: [],
    configSchema: {
      type: 'object',
      properties: {
        fetch: {
          type: 'boolean',
          title: 'fetch',
          description: 'Enable the web-fetch tool beside search.',
          default: true,
        },
        searchTimeoutMs: {
          type: 'integer',
          title: 'searchTimeoutMs',
          description: 'Search timeout in milliseconds.',
          minimum: 1000,
          maximum: 300000,
          default: 60000,
        },
      },
    },
    template: `- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  config:\n    fetch: true\n    searchTimeoutMs: 60000`,
  },
  {
    module: '@deepseek-ai/dsh-tool-jobs',
    kind: 'tool',
    label: 'Background Jobs',
    description: 'Model-facing controls over background jobs.',
    provides: ['tools'],
    consumes: [],
    template: `- id: tool-jobs\n  name: '@deepseek-ai/dsh-tool-jobs'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-skill',
    kind: 'tool',
    label: 'Skill Loader',
    description: 'Loads skills into the agent by catalog name.',
    provides: ['tools'],
    consumes: [],
    template: `- id: tool-skill\n  name: '@deepseek-ai/dsh-tool-skill'`,
  },
  {
    module: '@deepseek-ai/dsh-skill-filesystem',
    kind: 'skill',
    label: 'Filesystem Skill',
    description: 'Skill teaching filesystem conventions and layout.',
    provides: ['skills'],
    consumes: [],
    template: `- id: skill-filesystem\n  name: '@deepseek-ai/dsh-skill-filesystem'`,
  },
  {
    module: '@deepseek-ai/dsh-command-goal',
    kind: 'tool',
    label: 'Goal Command',
    description: 'Human command creating session goals.',
    provides: ['tools'],
    consumes: [],
    template: `- id: command-goal\n  name: '@deepseek-ai/dsh-command-goal'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-goal',
    kind: 'tool',
    label: 'Goal Tool',
    description: 'Model-facing goal management tool.',
    provides: ['tools'],
    consumes: [],
    template: `- id: tool-goal\n  name: '@deepseek-ai/dsh-tool-goal'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-ask-user',
    kind: 'tool',
    label: 'Ask User',
    description: 'Asks the user questions and collects answers.',
    provides: ['tools'],
    consumes: [],
    template: `- id: tool-ask-user\n  name: '@deepseek-ai/dsh-tool-ask-user'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-todo',
    kind: 'tool',
    label: 'Todo List',
    description: 'Structured task-list tracking for the agent.',
    provides: ['tools'],
    consumes: [],
    template: `- id: tool-todo\n  name: '@deepseek-ai/dsh-tool-todo'`,
  },
  {
    module: '@deepseek-ai/dsh-plan-mode',
    kind: 'loop',
    label: 'Plan Mode',
    description: 'Planning gate: the agent plans before it implements.',
    provides: [],
    consumes: [],
    configSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          title: 'section',
          description: 'The plan-mode rules injected as a prompt section.',
        },
      },
    },
    template: `- id: plan-mode\n  name: '@deepseek-ai/dsh-plan-mode'`,
  },
  {
    module: '@deepseek-ai/dsh-compaction-basic',
    kind: 'memory',
    label: 'Compaction',
    description: 'Context compaction for long conversations.',
    provides: ['memory'],
    consumes: [],
    template: `- id: compaction-basic\n  name: '@deepseek-ai/dsh-compaction-basic'`,
  },
  {
    module: '@deepseek-ai/dsh-compaction-tool-result-pruner',
    kind: 'memory',
    label: 'Tool Result Pruner',
    description: 'Prunes oversized tool results from context.',
    provides: ['memory'],
    consumes: [],
    template: `- id: tool-result-pruner\n  name: '@deepseek-ai/dsh-compaction-tool-result-pruner'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-subagent',
    kind: 'loop',
    label: 'Subagent',
    description: 'Delegates tasks to child agents.',
    provides: ['tools'],
    consumes: ['tools', 'system-prompt'],
    template: `- id: tool-subagent\n  name: '@deepseek-ai/dsh-tool-subagent'`,
  },
  {
    module: '@deepseek-ai/dsh-tool-workflow',
    kind: 'loop',
    label: 'Workflow',
    description: 'Runs JavaScript workflow scripts fanning out across subagents.',
    provides: ['tools'],
    consumes: ['tools', 'system-prompt'],
    template: `- id: tool-workflow\n  name: '@deepseek-ai/dsh-tool-workflow'`,
  },
  {
    module: 'cordis:group',
    kind: 'group',
    label: 'Group (组合容器)',
    description: 'Nests plugin rows; `isolate` gives the group its own realm.',
    provides: [],
    consumes: [],
    template: `- id: group\n  name: cordis:group\n  config:\n    - id: member\n      name: 'plugin-name'`,
  },
]

/** Registry lookup by exact module specifier. */
const BY_MODULE: ReadonlyMap<string, RegistryEntry> = new Map(REGISTRY.map(entry => [entry.module, entry]))

/**
 * Look one module up in the bundled registry.
 * @param moduleName - the row's module specifier.
 * @returns the curated entry, or undefined when the module is unregistered.
 */
export function registryEntry(moduleName: string | undefined): RegistryEntry | undefined {
  if (moduleName === undefined) return undefined
  return BY_MODULE.get(moduleName)
}
