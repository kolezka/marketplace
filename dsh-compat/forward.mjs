// Run the canonical claude-plugins-dsh CLI named by CLAUDE_PLUGINS_DSH_CLI and exit
// with its status. There is no fallback: an unset or missing path is an error.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

export function forward(args) {
  const cli = process.env.CLAUDE_PLUGINS_DSH_CLI
  if (!cli) {
    console.error('dsh-compat: set CLAUDE_PLUGINS_DSH_CLI to claude-plugins-dsh/dist/bin/cli.js (see dsh-compat/README.md)')
    process.exit(64)
  }
  if (!existsSync(cli)) {
    console.error(`dsh-compat: CLAUDE_PLUGINS_DSH_CLI not found: ${cli}`)
    process.exit(66)
  }
  const run = spawnSync(process.execPath, [cli, ...args], { stdio: 'inherit' })
  if (run.error) throw run.error
  process.exit(run.status ?? 1)
}
