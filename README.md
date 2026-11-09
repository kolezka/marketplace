<h1 align="center">kolezka plugins</h1>

<p align="center">
  <strong>A toolkit for Claude Code, from the first code search to a fleet of agents.</strong><br>
  Understand a codebase, keep context between sessions, learn from mistakes and coordinate longer work.
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#plugin-catalog">Plugin catalog</a> ·
  <a href="#usage-guides">Usage guides</a> ·
  <a href="#updates-and-migration">Updates</a> ·
  <a href="#add-a-plugin">Contribute</a>
</p>

---

## Quick start

Add the marketplace, then install a plugin you want to use. In Claude Code:

```text
/plugin marketplace add kolezka/marketplace
/plugin install block-docs@kolezka
/reload-plugins
```

Replace `block-docs` with any name from the catalog below. Adding the marketplace
makes the catalog available; it does **not** install all plugins.

The marketplace is named **`kolezka`**, not `marketplace`. Skills use the plugin's
namespace, for example `/block-docs:block-docs`.

## Plugin catalog

### Understand, design and document

| Plugin | When to use it | Access |
| --- | --- | --- |
| [repo-intel](#repo-intel) | Find code relationships and architecture context with codegraph and graphify. | Public |
| [block-docs](#block-docs) | Create, refresh or audit system documentation with source-backed contracts. | Public |
| [design-studio](#design-studio) | Compare UI directions as HTML drafts on a local canvas before changing product code. | Private |
| [performance-analyzer](#performance-analyzer) | Find which hooks, injected text and memory add cost to your sessions. | Public |

### Remember and improve

| Plugin | When to use it | Access |
| --- | --- | --- |
| [worklog-persist](#worklog-persist) | Carry task state, decisions and verified checkpoints across sessions in Outline. | Public |
| [self-improvement-loop](#self-improvement-loop) | Turn recurring session mistakes into proposed skills, hooks, rules and agents. | Public |
| [kolezka-bootstrap](#kolezka-bootstrap) | Install the maintainer's personal instructions, model routing and push guard. | Private |

### Delegate and deliver

| Plugin | When to use it | Access |
| --- | --- | --- |
| [agents-def](#agents-def) | Delegate bounded engineering tasks to role-specific subagents. | Public |
| [phased-delivery](#phased-delivery) | Run a long change one phase at a time, with review and verification between phases. | Private |
| [agent-fleet](#agent-fleet) | Supervise parallel agents in tmux on a local or remote host. | Private |

> **Private plugins need repository access.** This catalog is public, but it does
> not grant access to private source repositories. Use Git credentials with read
> access; never put credentials in the marketplace manifest.

## Usage guides

Choose a plugin below for installation, a first action and its requirements.
Each plugin lives in its own repository; follow its linked documentation for the
full setup and workflow.

### repo-intel

Install codegraph and graphify, keep their graphs fresh, and route the agent to
code structure or semantic context instead of starting each search from scratch.
Graphify's extraction can use a model backend you choose.

<details>
<summary>Install and index a repository</summary>

```text
/plugin install repo-intel@kolezka
/reload-plugins
/repo-intel:setup
```

Run setup in the repository you want indexed. It handles tool installation after
asking, backend configuration and the first build. Rebuild later with
`/repo-intel:build` or `repo-intel build`.

**Needs:** Git and `jq`; `uv` or `pipx`, plus `pnpm` or `npm`, for tool installation.
`repo-intel migrate-hooks` lists older global graph hooks the plugin replaces.

[Source and backend options](https://github.com/kolezka/repo-intel#readme)

</details>

### block-docs

Document a system one ownership block at a time. Writer and verifier agents work
with contracts, invariants, known gaps and claims pinned to a source revision.

<details>
<summary>Install and document a codebase</summary>

```text
/plugin install block-docs@kolezka
/reload-plugins
/block-docs:block-docs Document this repository under docs/.
Read the source at HEAD, identify ownership boundaries and document each block.
Do not commit or push.
```

It also supports refreshing existing documentation, auditing claims, and writing
from a committed design spec before implementation exists.

**Needs:** Python 3.9+ for structural linting, plus Git and the referenced commits
for revision validation.

[Source and documentation workflow](https://github.com/kolezka/block-docs#readme)

</details>

### design-studio

Explore UI directions before changing product code. The model creates a baseline
and alternative HTML drafts, checks renders in light and dark, and compares them
side by side on a local canvas. No separate design service is needed.

<details>
<summary>Install and compare design directions (private)</summary>

```text
/plugin install design-studio@kolezka
/reload-plugins
```

Start a new session and ask:

```text
Use design-studio: the settings page looks dated. Show me two directions before
we change any product code.
```

Drafts, screenshots and the selected design system live under `.design/` in the
project. Give feedback in chat, pick a direction, then ask to implement it when
ready. The canvas is for comparing drafts, not editing them.

**Needs:** Read access to the private repository, Bun and Chrome, Chromium, Edge
or Brave. Set `CHROME_PATH` for another browser path. Rendering needs network
access to load Tailwind from jsDelivr.

[Source, canvas and rendering tools](https://github.com/kolezka/design-studio#readme)

</details>

### performance-analyzer

Give the agent a read-only view of what its harness costs: hook time, injected
context and Hindsight memory, with the plugin or settings file behind each cost.

<details>
<summary>Install and inspect session overhead</summary>

```text
/plugin install performance-analyzer@kolezka
/reload-plugins
```

Start a new session and ask:

```text
Which hooks slow down my prompts, and how much context do they inject?
```

The agent starts with `harness_summary`, then uses the focused tools as needed.

**Needs:** Bun on `PATH`. Hook timing needs the Claude Performance Analyzer app
and its telemetry collector. Without the app, injected-text analysis still works.
The catalog uses the `release` branch with the built MCP server.

[Source and MCP setup](https://github.com/kolezka/claude-performance-analyzer#let-your-agent-check-its-setup-mcp)

</details>

### worklog-persist

Keep a durable task record in Outline: what is in progress, what was verified,
which decisions were made, what is blocked and what comes next.

<details>
<summary>Install and keep a task record</summary>

```text
/plugin install worklog-persist@kolezka
/reload-plugins
/worklog-persist:load
/worklog-persist:start <task description>
/worklog-persist:checkpoint <what is verified now>
/worklog-persist:complete
```

Use `/worklog-persist:handoff` before transferring work to another session.
`/worklog-persist:off` disables automatic persistence without uninstalling.

**Needs:** A reachable `outline` MCP server configured through environment
variables, plus Python 3 for redaction and PyYAML for the routing config.

[Source and Outline configuration](https://github.com/kolezka/worklog-persist#readme)

</details>

### self-improvement-loop

Review coding sessions in the background, find recurring lessons and draft
changes to skills, hooks, rules and agents. Inspect proposals in the local review
console, then keep or reject them.

<details>
<summary>Install and start the learning loop</summary>

```text
/plugin install self-improvement-loop@kolezka
/reload-plugins
/self-improvement-loop:loop
/self-improvement-loop:loop web
```

The first run creates config, a local `learned/` repository and `~/.local/bin/sil`.
The default model provider is your Claude CLI. Use namespaced commands to avoid
collisions with other plugins:

```text
/self-improvement-loop:reflect
/self-improvement-loop:feedback skill:<name> good
```

**Needs:** Bun 1.4.2+, Git and a working Claude Code CLI. Background reviews use
your model provider's quota or billing; transcript-derived content goes to that
provider. Put `~/.local/bin` on `PATH` for the terminal CLI.

[Source](https://github.com/kolezka/self-improvement-loop#readme) ·
[Install, scheduling and model providers](https://github.com/kolezka/self-improvement-loop/blob/release/docs/INSTALL.md)

</details>

### kolezka-bootstrap

The maintainer's personal setup, not a general-purpose prerequisite for this
catalog. It adds global `CLAUDE.md` instructions, model-pinned route agents, a
Git push guard and an off-topic teammate skill.

<details>
<summary>Install and preview the personal setup (private)</summary>

```text
/plugin install kolezka-bootstrap@kolezka
/reload-plugins
/kolezka-bootstrap:install --check
```

Read the preview before applying it with `/kolezka-bootstrap:install`. The
installer links the plugin's instructions into your config and preserves existing
content. `--migrate` also retires older local route agents and the inline push
hook; it is a separate, optional migration.

**Needs:** Read access to the private repository, `jq` and the Claude CLI. Review
the instructions and model routing before adopting this personal configuration.

[Source and installer modes](https://github.com/kolezka/kolezka-bootstrap#readme)

</details>

### agents-def

Role-specific subagents for exploration, codebase research, architecture,
implementation, debugging, tests, code review, security review and verification.
The orchestrator skill coordinates their work.

<details>
<summary>Install and delegate a task</summary>

```text
/plugin install agents-def@kolezka
/reload-plugins
/agents-def:orchestrator Implement the agreed change, delegate focused tasks and verify the result.
```

Agent types are namespaced, for example `agents-def:explorer` and
`agents-def:reviewer`. Remove old user-level copies when migrating so each role
does not appear twice. The `extras/general-purpose.md` override is opt-in and
needs a separate link; it is not installed as a plugin agent.

**Needs:** Claude Code subagent support. Read-only roles are prompt contracts,
not an operating-system sandbox.

[Source and agent roles](https://github.com/kolezka/claude-agents-def#readme)

</details>

### phased-delivery

Run a long change through one persistent worker in an isolated git worktree.
A fresh reviewer checks each phase; the main session verifies results and checks
with you before starting the next phase.

<details>
<summary>Install and start a phased change (private)</summary>

```text
/plugin install phased-delivery@kolezka
/reload-plugins
```

Then describe the work:

```text
Use phased-delivery: port the settings screen to the new design system in 4 phases.
```

Run state and reports stay in the worktree's Git directory. A new session can
resume from that state; the plugin does not keep running after the session ends.
An optional `.claude/phased-delivery.md` profile records repository-specific test
commands and rules.

**Needs:** Read access to the private repository, Git worktrees and Claude Code
worker/reviewer agents. It does not push or open PRs unless asked.

[Source, resume and workflow modes](https://github.com/kolezka/phased-delivery#readme)

</details>

### agent-fleet

Supervise several autonomous Claude Code agents, one per platform, area or ticket,
from one session. Includes a watchdog, message relay, owner decisions and
supervisor handoff. Pair it with phased-delivery inside each agent.

<details>
<summary>Install and prepare a fleet (private)</summary>

```text
/plugin install agent-fleet@kolezka
/reload-plugins
```

Then ask the supervisor:

```text
Use agent-fleet to prepare parallel agents for this project. Review the prompts,
autonomy limits and host configuration with me before starting them.
```

The supervisor uses the fleet CLI and skill. Install `phased-delivery` in the
agents' Claude config on the host. Configure `fleet.conf`, prompts and hard limits,
then sync and dry-run the watchdog before starting. Trust the agent working
directory manually once on the host.

**Needs:** Read access to the private repository. Agent host: Linux or macOS,
Bash 4+, tmux, ripgrep and Claude Code. A remote supervisor also needs key-based
SSH access. Local-only fleets do not need a separate host.

[Source, host setup and fleet CLI](https://github.com/kolezka/agent-fleet#readme)

</details>

## Updates and migration

From a terminal, refresh the catalog and update an installed plugin:

```sh
claude plugin marketplace update kolezka
claude plugin update block-docs@kolezka
```

Replace `block-docs` with the plugin you want to update. Run `/reload-plugins` in
active sessions; follow a plugin's setup guide if it requires a new session.
Releases and versions belong to the source repositories.

<details>
<summary>Switch from a standalone or development marketplace</summary>

Remove the old installation before installing the same plugin from this catalog.
For example:

```text
/plugin uninstall block-docs@block-docs
/plugin install block-docs@kolezka
/reload-plugins
```

For a development marketplace, use its actual name in the uninstall command.

</details>

## Add a plugin

This repository holds the catalog and its guide, not copies of plugin code.
Add an entry to [`plugins` in the manifest](.claude-plugin/marketplace.json):

```json
{
  "name": "example-plugin",
  "description": "Describe when the plugin is useful",
  "source": {
    "source": "github",
    "repo": "kolezka/example-plugin",
    "ref": "main"
  }
}
```

The name must match the source plugin's `.claude-plugin/plugin.json`. Its
repository must contain that manifest and the advertised components. Set `ref`
to the intended branch, release ref or commit pin; catalog entries do not all
follow the same branch.

**Update this README too:** add the plugin to the catalog and include a usage
guide with requirements, a first action, access level and a source link.

Validate the manifest:

```sh
claude plugin validate .claude-plugin/marketplace.json --strict
```

Validation checks catalog structure, not repository access or plugin behavior.
Test installation separately.

---

Maintained by [kolezka](https://github.com/kolezka). See the official guides for
[plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) and
[discovering and installing plugins](https://code.claude.com/docs/en/discover-plugins).
