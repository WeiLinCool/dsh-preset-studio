/** Shared composition fixtures for the core tests. */

/** A miniature composition modelled on the shipped standard preset. */
export const MINI_COMPOSITION = `# Miniature agent composition (test fixture)
- id: persona
  name: '@deepseek-ai/dsh-persona'
  config:
    text: You are a coding agent.

- id: agent-instructions
  name: '@deepseek-ai/dsh-agent-instructions'
  config:
    maxBytes: 65536

- id: tool-bash
  name: '@deepseek-ai/dsh-tool-bash'

- id: tool-web
  name: '@deepseek-ai/dsh-tool-web'
  config:
    fetch: true
    searchTimeoutMs: 60000

- id: planning
  name: cordis:group
  isolate:
    planMode: true
  config:
    - id: plan-mode
      name: '@deepseek-ai/dsh-plan-mode'
      config:
        section: Plan before implementing.

- id: compaction
  name: cordis:group
  config:
    - id: compaction-basic
      name: '@deepseek-ai/dsh-compaction-basic'

    - id: tool-result-pruner
      name: '@deepseek-ai/dsh-compaction-tool-result-pruner'

- id: delegation
  name: cordis:group
  config:
    - id: tool-subagent
      name: '@deepseek-ai/dsh-tool-subagent'

    - id: tool-workflow
      name: '@deepseek-ai/dsh-tool-workflow'
`

/** A composition exercising `!!js` conditional disablement. */
export const CONDITIONAL_COMPOSITION = `- id: tool-bash
  name: '@deepseek-ai/dsh-tool-bash'
  disabled: !!js process.platform === 'win32'

- id: tool-pwsh
  name: '@deepseek-ai/dsh-tool-pwsh'
  disabled: !!js process.platform !== 'win32'
`

/** A malformed composition: the root is not a list. */
export const NOT_A_LIST = `name: not-a-composition\n`

/** A composition with structural problems. */
export const PROBLEM_COMPOSITION = `- id: first
  name: '@deepseek-ai/dsh-tool-bash'

- id: first
  name: '@deepseek-ai/dsh-tool-web'

- no-name-row: true

- id: unknown
  name: 'not-a-loadable-package'
`
