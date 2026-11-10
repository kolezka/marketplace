# DeepSeek Harness adapters

Each kolezka plugin can also run in [DeepSeek Harness](https://github.com/deepseek-ai)
(DSH) through a `dsh/` directory next to its `.claude-plugin/`. Claude Code never reads
`dsh/`, so the same tree keeps working in both harnesses.

The runtime and its tools live in one place:
[kolezka/claude-plugins-dsh](https://github.com/kolezka/claude-plugins-dsh). Adapters
are refreshed from commit `a721298862b4dd3244ce3b48a184f95c512dc700`, which adds
exec-form hooks (`command` plus `args`) and `onFailure: "block"`. The package version
is still `0.1.0`; the npm `0.1.0` release may predate that commit, so build from the
commit when exact behavior matters. Its README describes what maps to what and what
is not mapped (function hooks, `PreCompact`, `Notification`, LSP servers, per-agent
model pins). MCP servers from `.mcp.json` are not handled by the runtime; a plugin
that needs one documents the manual setup in its own repository.

This directory used to hold its own copy of the runtime. That copy fell behind and
was removed; do not add one here again. The old scripts remain as thin wrappers, see
[Old scripts](#old-scripts).

## Adapters by plugin

Each adapter belongs in the plugin's own repository, at the plugin root the catalog
installs from. Adapters for the a721298 runtime are added or refreshed in separate
per-plugin pull requests. Until one is merged, that plugin's adapter may be missing
or out of date on its catalog ref.

| Plugin | Repository | Catalog ref | Adapter |
| --- | --- | --- | --- |
| `block-docs` | `kolezka/block-docs` | `main` | `dsh/` |
| `self-improvement-loop` | `kolezka/self-improvement-loop` | `release` | `dsh/` |
| `worklog-persist` | `kolezka/worklog-persist` | `master` | `dsh/` |
| `repo-intel` | `kolezka/repo-intel` | `main` | `dsh/` |
| `agents-def` | `kolezka/claude-agents-def` | `main` | `dsh/` |
| `kolezka-bootstrap` | `kolezka/kolezka-bootstrap` | `main` | `dsh/` |
| `performance-analyzer` | `kolezka/claude-performance-analyzer` | `release` | `dsh/` |
| `phased-delivery` | `kolezka/phased-delivery` | `main` | `dsh/` |
| `agent-fleet` | `kolezka/agent-fleet` | `main` | `dsh/` |
| `design-studio` | `kolezka/design-studio` | `main` | `dsh/` |
| `docify` | `kolezka/docify` | `main` | `integrations/claude-code/docify/dsh/` |
| `stealth-search` | `kolezka/claude-stealth-search-plugin` | `main` | `dsh/` |

An adapter reaches users only once it is on the catalog ref. Changes land on each
repository's development branch first; plugins whose catalog ref is `release` ship
an adapter change only after that repository cuts a release.

## Install into DSH

From a plugin checkout, through DSH's plugin manager:

```sh
dsh plugin --profile web add file:/abs/path/to/plugin/dsh
```

Or for every profile, add a row to `~/.dsh/cordis.patch.yml`:

```yaml
- insert:
    - id: claude-compat-<plugin>
      name: "file:///abs/path/to/plugin/dsh/index.js"
```

## Add or refresh an adapter

Run the CLI from a checkout of `claude-plugins-dsh` at the commit above, after
`pnpm install --frozen-lockfile && pnpm run build`:

```sh
cli=/path/to/claude-plugins-dsh/dist/bin/cli.js
node "$cli" scaffold --scope @kolezka <plugin-root>   # new adapter
node "$cli" sync <plugin-root>                        # refresh the vendored runtime
node "$cli" sync --check <plugin-root>                # fail on drift
node "$cli" inspect <plugin-root>                     # list registrations
```

`scaffold` writes `package.json`, `locale/en.json` and the runtime copy. Write
`index.js` and `cordis.patch.yml` by hand. `inspect` imports the plugin's
JavaScript, so run it only on code you trust.

## Old scripts

`sync.sh`, `scaffold.mjs` and `inspect.mjs` here still work, but they only forward to
the canonical CLI. Point them at a built checkout first; there is no fallback to npm
or a bundled copy:

```sh
export CLAUDE_PLUGINS_DSH_CLI=/path/to/claude-plugins-dsh/dist/bin/cli.js
dsh-compat/sync.sh [--check] <plugin-root>...   # runs: sync [--check]
node dsh-compat/scaffold.mjs <plugin-root>...   # runs: scaffold --scope @kolezka
node dsh-compat/inspect.mjs <plugin-root>...     # runs: inspect
```

Unset, they exit 64; a missing path exits 66. Otherwise they return the CLI's exit
code. `node --test dsh-compat/` checks this. New scripts should call the CLI directly.
