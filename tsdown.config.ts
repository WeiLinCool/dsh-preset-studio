/**
 * Standalone build config for the preset-studio client plugin.
 */
import { clientBundle } from './shared/tsdown.client.ts'

export default clientBundle('@weilin-cool/dsh-preset-studio', ['src/index.ts', 'src/invariant.ts'], {
  libExternal: [
    '@deepseek-ai/dsh-settings',
    '@deepseek-ai/dsh-system-prompt',
  ],
})
