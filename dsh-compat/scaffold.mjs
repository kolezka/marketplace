// Write the generated files of a plugin's dsh/ directory: package.json, locale/en.json
// and the vendored claude-compat.js. index.js and cordis.patch.yml are hand-written
// per plugin and never touched here. Usage:
//   node dsh-compat/scaffold.mjs <plugin-dir>...
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

for (const arg of process.argv.slice(2)) {
  const root = resolve(arg)
  const manifest = JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8'))
  const dsh = join(root, 'dsh')
  mkdirSync(join(dsh, 'locale'), { recursive: true })
  copyFileSync(join(here, 'claude-compat.js'), join(dsh, 'claude-compat.js'))

  const pkg = {
    name: `@kolezka/${manifest.name}-dsh`,
    version: manifest.version ?? '0.0.0',
    private: true,
    description: `DeepSeek Harness adapter for the ${manifest.name} Claude Code plugin`,
    type: 'module',
    exports: { '.': './index.js', './locale/*.json': './locale/*.json' },
    files: ['index.js', 'claude-compat.js', 'cordis.patch.yml', 'locale/*.json'],
    dsh: { bundle: { patch: './cordis.patch.yml' } },
  }
  writeFileSync(join(dsh, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')

  const locale = { meta: { title: manifest.name, description: manifest.description ?? '' } }
  writeFileSync(join(dsh, 'locale', 'en.json'), JSON.stringify(locale, null, 2) + '\n')

  for (const required of ['index.js', 'cordis.patch.yml']) {
    if (!existsSync(join(dsh, required))) console.warn(`${manifest.name}: dsh/${required} is missing, write it by hand`)
  }
  console.log(`scaffolded ${dsh}`)
}
