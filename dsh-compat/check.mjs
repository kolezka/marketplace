// Check that each plugin's dsh/ adapter uses claude-plugin-dsh as a direct dependency:
// exact pinned version, a direct import, a committed bun.lock and no vendored runtime.
//   node dsh-compat/check.mjs <plugin-dir>...
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const dirs = process.argv.slice(2)
if (!dirs.length) {
  console.error('usage: dsh-compat/sync.sh --check <plugin-dir>...')
  process.exit(64)
}

let drift = false
for (const arg of dirs) {
  const dsh = join(resolve(arg), 'dsh')
  const problems = []
  if (existsSync(join(dsh, 'claude-compat.js'))) problems.push('vendored dsh/claude-compat.js is present')
  let pkg = {}
  try {
    pkg = JSON.parse(readFileSync(join(dsh, 'package.json'), 'utf8'))
  } catch (error) {
    problems.push(`dsh/package.json is unreadable: ${error.message}`)
  }
  const version = pkg.dependencies?.['claude-plugin-dsh']
  if (!version) problems.push('dsh/package.json does not depend on claude-plugin-dsh')
  else if (!/^\d+\.\d+\.\d+$/.test(version)) problems.push(`claude-plugin-dsh version ${version} is not exact`)
  if (pkg.files?.includes('claude-compat.js')) problems.push('dsh/package.json files lists claude-compat.js')
  const index = existsSync(join(dsh, 'index.js')) ? readFileSync(join(dsh, 'index.js'), 'utf8') : ''
  if (!/from\s+['"]claude-plugin-dsh['"]/.test(index)) problems.push("dsh/index.js does not import from 'claude-plugin-dsh'")
  if (!existsSync(join(dsh, 'bun.lock'))) problems.push('dsh/bun.lock is missing')
  if (problems.length) {
    drift = true
    for (const problem of problems) console.log(`drift: ${arg}: ${problem}`)
  } else {
    console.log(`ok: ${arg}`)
  }
}
process.exit(drift ? 1 : 0)
