# dsh-compat

Lets every kolezka plugin run in [DeepSeek Harness](https://github.com/deepseek-ai) (DSH)
without changing how it runs in Claude Code.

Each plugin repo has a `dsh/` directory:

```
dsh/
  package.json        DSH bundle manifest (dsh.bundle.patch)
  cordis.patch.yml    plugin row, plus dsh-mcp-client rows for .mcp.json servers
  index.js            createPlugin({...}) with the plugin's mapping choices
  claude-compat.js    vendored copy of dsh-compat/claude-compat.js, never edit there
  locale/en.json      title and description for the DSH plugin manager
```

Claude Code never reads `dsh/`, and the adapter only reads the plugin's own
`skills/`, `commands/`, `agents/`, `hooks/hooks.json` and instruction files. So one
tree serves both harnesses and there is nothing to keep in sync by hand.

## What maps to what

| Claude Code | DSH |
|---|---|
| `skills/<n>/SKILL.md` | skill, rank 450 (a same-named skill in `~/.dsh/skills` still wins) |
| `commands/<n>.md` | `/<plugin>-<n>` slash command; the body is sent as the next turn |
| `agents/<n>.md` | skill `<plugin>-agent-<n>`: a role brief for `subagent` / `spawn_teammate` |
| `CLAUDE.md`-style files listed in `index.js` | system prompt section, `<!--harness:claude-only-->` blocks removed |
| `PreToolUse` hook | `tools/pre-execute`; `ask` becomes a DSH approval, `deny`/exit 2 denies |
| `PostToolUse` hook | `tools/result` (fire and forget) |
| `SessionStart`, `UserPromptSubmit` | first step of an agent / a step with a user message; context joins that step |
| `Stop`, `SubagentStop` | `agent/turn-stopping`; `{"decision":"block"}` steers one more step |
| `SessionEnd` | `agent/disposed` |
| `.mcp.json` | `@deepseek-ai/dsh-mcp-client` rows in `cordis.patch.yml` |

Hooks get Claude Code's stdin JSON (`session_id`, `cwd`, `hook_event_name`,
`tool_name` with Claude names such as `Bash`, `tool_input`, `transcript_path`) and
`CLAUDE_PLUGIN_ROOT`, plus `CLAUDE_HARNESS=dsh` so a script can tell the two apart.
`transcript_path` is a Claude-shaped JSONL export of the DSH session under
`$DSH_HOME/state/claude-compat/transcripts/`. It is rewritten for `Stop`,
`SubagentStop` and `SessionEnd`; other events reuse the last export.

Not mapped: function hooks (`hooks.json` `modules`), `PreCompact`, `Notification`,
LSP servers, per-agent model pins. A plugin can turn off any part with the row config
`disable: [skills, commands, agents, instructions, hooks]`.

## Install

From the plugin checkout, with DSH's plugin manager (asks for approval):

```
dsh plugin --profile web add file:/abs/path/to/plugin/dsh
```

or, to load it in every profile, add a row to `~/.dsh/cordis.patch.yml`:

```yaml
- insert:
    - id: claude-compat-<plugin>
      name: file:///abs/path/to/plugin/dsh/index.js
```

## Changing the runtime

Edit `dsh-compat/claude-compat.js` here, run `node --test dsh-compat/`, then copy it
into every plugin with `dsh-compat/sync.sh <plugin-dir>...`. `sync.sh --check` fails on
a drifted copy.
