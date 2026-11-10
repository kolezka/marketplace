# dsh-compat

Lets every kolezka plugin run in [DeepSeek Harness](https://github.com/deepseek-ai) (DSH)
without changing how it runs in Claude Code.

The runtime is the public npm package
[`claude-plugin-dsh`](https://www.npmjs.com/package/claude-plugin-dsh), pinned to an exact
version. Each adapter imports it directly. Nothing in this repository or in a plugin keeps
a copy of the runtime.

## Adapter shape

Each plugin repo has a `dsh/` directory next to `.claude-plugin/`:

```
dsh/
  package.json        DSH bundle manifest, depends on claude-plugin-dsh (exact version)
  bun.lock            committed, so `bun install --frozen-lockfile` is reproducible
  cordis.patch.yml    plugin row, plus dsh-mcp-client rows for .mcp.json servers
  index.js            createPlugin({...}) with the plugin's mapping choices
  locale/en.json      title and description for the DSH plugin manager
```

`dsh/package.json`:

```json
{
  "name": "@kolezka/<plugin>-dsh",
  "version": "<plugin version>",
  "private": true,
  "type": "module",
  "exports": { ".": "./index.js", "./locale/*.json": "./locale/*.json" },
  "files": ["index.js", "bun.lock", "cordis.patch.yml", "locale/*.json"],
  "dependencies": { "claude-plugin-dsh": "0.1.0" },
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

`dsh/index.js`:

```js
import { createPlugin, rootFrom } from 'claude-plugin-dsh'

const plugin = createPlugin({
  root: rootFrom(import.meta.url),
  // plugin-specific options: instructions, skills/commands prefix and exclude, hooks, ...
})
export const { name, apply } = plugin
export default plugin
```

Keep `root: rootFrom(import.meta.url)` in the adapter so the root is the plugin
checkout, not `node_modules`. Add `dsh/node_modules/` to the plugin's `.gitignore`.

Claude Code never reads `dsh/`, and the adapter only reads the plugin's own `skills/`,
`commands/`, `agents/`, `hooks/hooks.json` and instruction files. So one tree serves
both harnesses.

## What maps to what

| Claude Code | DSH |
|---|---|
| `skills/<n>/SKILL.md` | skill, rank 450 (a same-named skill in `~/.dsh/skills` still wins) |
| `commands/<n>.md` | `/<plugin>-<n>` slash command; the body is sent as the next turn |
| `agents/<n>.md` | skill `<plugin>-agent-<n>`: a role brief for `subagent` / `spawn_teammate` |
| `CLAUDE.md`-style files listed in `index.js` | system prompt section, `<!--harness:claude-only-->` blocks removed |
| `PreToolUse` hook | `tools/pre-execute`; `ask` becomes a DSH approval, `deny`/exit 2 denies |
| `PostToolUse` hook | `tools/post-execute` |
| `SessionStart`, `UserPromptSubmit` | `agent/created` of a root agent / a step with a user message |
| `Stop`, `SubagentStop` | `agent/turn-stopping`; `{"decision":"block"}` steers one more step |
| `SessionEnd` | `agent/disposed` |
| `.mcp.json` | not mapped automatically: add explicit `@deepseek-ai/dsh-mcp-client` rows to `cordis.patch.yml` |

Not mapped: function hooks (`hooks.json` `modules`), `PreCompact`, `Notification`,
LSP servers, per-agent model pins. A plugin can turn off any part with the row config
`disable: [skills, commands, agents, instructions, hooks]`. The package README has the
full hook contract.

## Install

Install the adapter's dependencies first. DSH is not known to install them for you:

```sh
cd /abs/path/to/plugin/dsh && bun install --frozen-lockfile
```

Then add it with DSH's plugin manager (asks for approval):

```
dsh plugin --profile web add file:/abs/path/to/plugin/dsh
```

or, to load it in every profile, add a row to `~/.dsh/cordis.patch.yml`:

```yaml
- insert:
    - id: claude-compat-<plugin>
      name: file:///abs/path/to/plugin/dsh/index.js
```

Check what an installed adapter registers, without starting DSH. This imports the
plugin's JavaScript, so run it only on trusted plugins:

```sh
bun x claude-plugin-dsh@0.1.0 inspect /abs/path/to/plugin
```

## Updating the runtime

The runtime lives in the `claude-plugin-dsh` repository, not here. To move an adapter
to a new published version:

```sh
cd /abs/path/to/plugin/dsh
bun add --exact claude-plugin-dsh@<version>
```

Commit `dsh/package.json` and `dsh/bun.lock`.

Do not run the package's `scaffold` or `sync` commands on these adapters. In 0.1.0 they
write a vendored `dsh/claude-compat.js`, which direct-dependency adapters do not use.

## Maintainer scripts

The scripts here run the published CLI installed in `dsh-compat/node_modules`. They do
not fall back to a local checkout or a vendored copy. Install once:

```sh
cd dsh-compat && bun install --frozen-lockfile
```

| Script | Behavior |
|---|---|
| `node dsh-compat/inspect.mjs <plugin-dir>...` | runs `claude-plugin-dsh inspect` and returns its exit code; each adapter needs its own `bun install` first |
| `dsh-compat/sync.sh --check <plugin-dir>...` | checks the direct-dependency shape: exact version, direct import, `bun.lock`, no vendored runtime. Exit 1 on drift |
| `dsh-compat/sync.sh <plugin-dir>...` | retired, exits 64: there is no runtime to copy |
| `node dsh-compat/scaffold.mjs <plugin-dir>...` | retired, exits 64: write `dsh/` by hand as shown above |

A missing install or a version that differs from the pin in `dsh-compat/package.json`
exits 69 with the install command.

Tests (they install a fixture adapter with Bun, so they need network or a warm cache):

```sh
cd dsh-compat && bun install --frozen-lockfile && bun run test
```
