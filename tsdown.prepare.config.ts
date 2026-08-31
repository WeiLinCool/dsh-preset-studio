/**
 * Consumer-side build for git installs (the `prepare` script).
 */
import { clientBundle } from './shared/tsdown.client.ts'

export default clientBundle('@tieveto666-code/dsh-preset-studio', ['src/index.ts', 'src/invariant.ts'], {
  libExternal: [
    '@deepseek-ai/dsh-settings',
    '@deepseek-ai/dsh-system-prompt',
  ],
})
