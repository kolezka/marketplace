// Run the published claude-plugin-dsh CLI installed in dsh-compat/node_modules and
// exit with its status. There is no fallback to a local checkout or a vendored copy.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const install = `run \`bun install --frozen-lockfile\` in ${here}`

function fail(message) {
  console.error(`dsh-compat: ${message}`)
  process.exit(69)
}

export function cliPath() {
  const expected = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8')).dependencies['claude-plugin-dsh']
  let manifestPath
  try {
    manifestPath = createRequire(import.meta.url).resolve('claude-plugin-dsh/package.json')
  } catch {
    fail(`claude-plugin-dsh is not installed; ${install}`)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (manifest.version !== expected) fail(`claude-plugin-dsh installed ${manifest.version}, expected ${expected}; ${install}`)
  return join(dirname(manifestPath), manifest.bin['claude-plugin-dsh'])
}

export function forward(args) {
  const run = spawnSync(process.execPath, [cliPath(), ...args], { stdio: 'inherit' })
  if (run.error) throw run.error
  process.exit(run.status ?? 1)
}
