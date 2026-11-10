// The wrappers must pass arguments through to the canonical CLI unchanged, return its
// exit code, and fail clearly when the CLI path is unset or wrong.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const fake = join(mkdtempSync(join(tmpdir(), 'dsh-compat-')), 'cli.js')
writeFileSync(fake, 'console.log(JSON.stringify(process.argv.slice(2))); process.exit(Number(process.env.FAKE_EXIT ?? 0))\n')

function run(cmd, args, env) {
  const childEnv = { ...process.env, ...env }
  for (const [k, v] of Object.entries(childEnv)) if (v === undefined) delete childEnv[k]
  return spawnSync(cmd, args, { env: childEnv, encoding: 'utf8' })
}

const cases = [
  ['sync.sh', 'sh', [join(here, 'sync.sh'), '--check', 'a', 'b c'], ['sync', '--check', 'a', 'b c']],
  ['scaffold.mjs', process.execPath, [join(here, 'scaffold.mjs'), 'a'], ['scaffold', '--scope', '@kolezka', 'a']],
  ['inspect.mjs', process.execPath, [join(here, 'inspect.mjs'), 'a', 'b'], ['inspect', 'a', 'b']],
]

for (const [name, cmd, args, expected] of cases) {
  test(`${name} forwards arguments and exit code`, () => {
    const ok = run(cmd, args, { CLAUDE_PLUGINS_DSH_CLI: fake, FAKE_EXIT: '0' })
    assert.equal(ok.status, 0, ok.stderr)
    assert.deepEqual(JSON.parse(ok.stdout), expected)
    const failed = run(cmd, args, { CLAUDE_PLUGINS_DSH_CLI: fake, FAKE_EXIT: '3' })
    assert.equal(failed.status, 3)
  })

  test(`${name} fails clearly without a usable CLI path`, () => {
    const unset = run(cmd, args, { CLAUDE_PLUGINS_DSH_CLI: undefined })
    assert.equal(unset.status, 64)
    assert.match(unset.stderr, /set CLAUDE_PLUGINS_DSH_CLI/)
    const missing = run(cmd, args, { CLAUDE_PLUGINS_DSH_CLI: join(here, 'no-such-cli.js') })
    assert.equal(missing.status, 66)
    assert.match(missing.stderr, /not found/)
  })
}
