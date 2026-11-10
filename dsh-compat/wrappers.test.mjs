// The dsh-compat scripts run the published claude-plugin-dsh CLI installed in
// dsh-compat/node_modules. These tests use a real adapter fixture that imports the
// package directly, installed with Bun, so they need network or a warm Bun cache.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { before, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const expectedVersion = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8')).dependencies['claude-plugin-dsh']
const scratch = mkdtempSync(join(tmpdir(), 'dsh-compat-test-'))
const plugin = join(scratch, 'fixture-plugin')

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', ...opts })
}

function write(path, text) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
}

// A small Claude Code plugin with a direct-dependency dsh/ adapter.
function makePlugin(root) {
  write(join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'fixture-plugin', version: '1.2.3', description: 'Fixture' }))
  write(join(root, 'skills', 'greet', 'SKILL.md'), '---\nname: greet\ndescription: Greet the user\n---\nSay FIXTURE_SKILL_BODY to the user.\n')
  write(join(root, 'commands', 'ping.md'), '---\ndescription: Ping\n---\nReply with FIXTURE_COMMAND_BODY.\n')
  write(join(root, 'hooks', 'hooks.json'), JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'true' }] }] } }))
  write(join(root, 'CLAUDE.md'), 'FIXTURE_PROMPT_TEXT\n<!--harness:claude-only-->\nclaude only\n<!--/harness-->\n')
  write(join(root, 'dsh', 'package.json'), JSON.stringify({
    name: '@kolezka/fixture-plugin-dsh',
    version: '1.2.3',
    private: true,
    type: 'module',
    exports: { '.': './index.js' },
    files: ['index.js', 'bun.lock'],
    dependencies: { 'claude-plugin-dsh': expectedVersion },
  }, null, 2))
  write(join(root, 'dsh', 'index.js'), [
    "import { createPlugin, rootFrom } from 'claude-plugin-dsh'",
    '',
    "const plugin = createPlugin({ root: rootFrom(import.meta.url), instructions: ['CLAUDE.md'] })",
    'export const { name, apply } = plugin',
    'export default plugin',
    '',
  ].join('\n'))
}

before(() => {
  assert.ok(existsSync(join(here, 'node_modules', 'claude-plugin-dsh')), 'run `bun install --frozen-lockfile` in dsh-compat first')
  makePlugin(plugin)
  const install = run('bun', ['install'], { cwd: join(plugin, 'dsh') })
  assert.equal(install.status, 0, install.stderr)
  assert.ok(existsSync(join(plugin, 'dsh', 'bun.lock')))
})

test('forward resolves the installed published CLI, not a local or vendored copy', async () => {
  const { cliPath } = await import(pathToFileURL(join(here, 'forward.mjs')).href)
  const cli = cliPath()
  assert.ok(cli.startsWith(realpathSync(join(here, 'node_modules', 'claude-plugin-dsh')) + '/'), `not the installed package: ${cli}`)
  assert.ok(cli.endsWith('/dist/bin/cli.js'), cli)
  assert.ok(existsSync(cli), cli)
  const pkg = JSON.parse(readFileSync(join(here, 'node_modules', 'claude-plugin-dsh', 'package.json'), 'utf8'))
  assert.equal(pkg.version, expectedVersion)
})

test('dsh-compat pins the exact published version and vendors no runtime', () => {
  assert.match(expectedVersion, /^\d+\.\d+\.\d+$/)
  assert.ok(!existsSync(join(here, 'claude-compat.js')))
  assert.match(readFileSync(join(here, 'bun.lock'), 'utf8'), new RegExp(`"claude-plugin-dsh@${expectedVersion.replaceAll('.', '\\.')}"`))
})

test('the fixture adapter resolves claude-plugin-dsh from its own dsh/node_modules', async () => {
  const require = createRequire(join(plugin, 'dsh', 'index.js'))
  const resolved = realpathSync(require.resolve('claude-plugin-dsh/package.json'))
  assert.equal(resolved, realpathSync(join(plugin, 'dsh', 'node_modules', 'claude-plugin-dsh', 'package.json')))

  const mod = await import(pathToFileURL(join(plugin, 'dsh', 'index.js')).href)
  const providers = []
  const commands = []
  const sections = []
  const events = []
  const ctx = {
    logger: { warn() {} },
    skills: { registerProvider: (create) => providers.push(create({ signal: new AbortController().signal, invalidate() {} })) },
    commands: { register: (d) => commands.push(d.name) },
    systemPrompt: { section: (s) => sections.push(s) },
    workingDirectory: { get: () => plugin },
    inject: (_names, fn) => fn(ctx),
    effect() {},
    on: (event) => events.push(event),
  }
  await mod.apply(ctx, {})
  const bodies = {}
  for (const provider of providers) {
    for (const candidate of await provider.list({})) bodies[candidate.name] = (await provider.get(candidate, {}))?.content
  }
  assert.equal(mod.name, 'claude-compat-fixture-plugin')
  assert.match(bodies.greet ?? '', /FIXTURE_SKILL_BODY/)
  assert.deepEqual(commands, ['fixture-plugin-ping'])
  const prompt = sections.map((s) => (typeof s.text === 'string' ? s.text : s.text({}))).join('')
  assert.match(prompt, /FIXTURE_PROMPT_TEXT/)
  assert.doesNotMatch(prompt, /claude only/)
  assert.ok(events.includes('tools/pre-execute'), events.join(','))
})

test('inspect.mjs runs the published CLI against the real adapter', () => {
  const r = run(process.execPath, [join(here, 'inspect.mjs'), plugin])
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /^claude-compat-fixture-plugin$/m)
  assert.match(r.stdout, /skills: {3}greet$/m)
  assert.match(r.stdout, /commands: \/fixture-plugin-ping$/m)
  assert.match(r.stdout, /claude-only left: false/)
  assert.match(r.stdout, /tools\/pre-execute/)
})

test('inspect.mjs passes argv through and returns the CLI exit code', () => {
  const usage = run(process.execPath, [join(here, 'inspect.mjs')])
  assert.equal(usage.status, 64)
  assert.match(usage.stderr, /inspect requires at least one plugin directory/)
  const help = run(process.execPath, [join(here, 'inspect.mjs'), '--help'])
  assert.equal(help.status, 0)
  assert.match(help.stdout, /Usage: claude-plugin-dsh/)
})

test('inspect.mjs fails when the adapter cannot resolve claude-plugin-dsh', () => {
  const broken = join(scratch, 'broken-plugin')
  cpSync(plugin, broken, { recursive: true, filter: (src) => !src.includes('node_modules') })
  const r = run(process.execPath, [join(here, 'inspect.mjs'), broken], { cwd: scratch })
  assert.equal(r.status, 1)
  assert.match(r.stderr, /Cannot find package 'claude-plugin-dsh'/)
})

test('the wrappers refuse to run without the installed package', () => {
  const bare = join(scratch, 'bare-dsh-compat')
  mkdirSync(bare)
  for (const f of ['package.json', 'forward.mjs', 'inspect.mjs']) cpSync(join(here, f), join(bare, f))
  const r = run(process.execPath, [join(bare, 'inspect.mjs'), plugin], { cwd: scratch })
  assert.equal(r.status, 69)
  assert.match(r.stderr, /claude-plugin-dsh is not installed.*bun install --frozen-lockfile/s)
})

test('the wrappers refuse an installed version that differs from the pin', () => {
  const skewed = join(scratch, 'skewed-dsh-compat')
  mkdirSync(skewed)
  for (const f of ['forward.mjs', 'inspect.mjs']) cpSync(join(here, f), join(skewed, f))
  write(join(skewed, 'package.json'), JSON.stringify({ type: 'module', dependencies: { 'claude-plugin-dsh': '0.0.1' } }))
  symlinkSync(join(here, 'node_modules'), join(skewed, 'node_modules'))
  const r = run(process.execPath, [join(skewed, 'inspect.mjs'), plugin], { cwd: scratch })
  assert.equal(r.status, 69)
  assert.match(r.stderr, new RegExp(`installed ${expectedVersion.replaceAll('.', '\\.')}, expected 0\\.0\\.1`))
})

test('scaffold.mjs rejects vendoring with a direct-dependency diagnostic', () => {
  const target = join(scratch, 'scaffold-target')
  makePlugin(target)
  const r = run(process.execPath, [join(here, 'scaffold.mjs'), target])
  assert.equal(r.status, 64)
  assert.match(r.stderr, /direct dependency/)
  assert.ok(!existsSync(join(target, 'dsh', 'claude-compat.js')))
})

test('sync.sh without --check rejects copying the runtime', () => {
  const r = run('sh', [join(here, 'sync.sh'), plugin])
  assert.equal(r.status, 64)
  assert.match(r.stderr, /direct dependency/)
  assert.ok(!existsSync(join(plugin, 'dsh', 'claude-compat.js')))
})

test('sync.sh --check accepts a direct-dependency adapter and reports vendored drift', () => {
  const ok = run('sh', [join(here, 'sync.sh'), '--check', plugin])
  assert.equal(ok.status, 0, ok.stdout + ok.stderr)
  assert.match(ok.stdout, /^ok: /m)

  const vendored = join(scratch, 'vendored-plugin')
  makePlugin(vendored)
  write(join(vendored, 'dsh', 'claude-compat.js'), 'export {}\n')
  write(join(vendored, 'dsh', 'index.js'), "import { createPlugin, rootFrom } from './claude-compat.js'\n")
  const pkg = JSON.parse(readFileSync(join(vendored, 'dsh', 'package.json'), 'utf8'))
  pkg.dependencies['claude-plugin-dsh'] = `^${expectedVersion}`
  pkg.files.push('claude-compat.js')
  write(join(vendored, 'dsh', 'package.json'), JSON.stringify(pkg))
  const bad = run('sh', [join(here, 'sync.sh'), '--check', vendored, plugin])
  assert.equal(bad.status, 1)
  for (const reason of [/vendored dsh\/claude-compat\.js/, /not exact/, /files lists claude-compat\.js/, /index\.js does not import/, /bun\.lock is missing/]) {
    assert.match(bad.stdout, reason)
  }
  assert.match(bad.stdout, new RegExp(`^ok: ${plugin.replaceAll('/', '\\/')}$`, 'm'))
})
