# kolezka plugin marketplace

A public catalog of Claude Code plugins maintained by [kolezka](https://github.com/kolezka).
Each plugin is maintained in its own repository. This repository contains only the
marketplace manifest and installation instructions; it does not run a service.

## Install

In Claude Code:

```text
/plugin marketplace add kolezka/marketplace
/plugin install block-docs@kolezka
/reload-plugins
```

Adding the marketplace makes its catalog available. It does not install every
listed plugin. Install the plugins you want individually.

The marketplace name is `kolezka`, even though the GitHub repository is named
`marketplace`. Plugin skills keep their own namespace, such as
`/block-docs:block-docs`.

## Plugins

| Plugin | Purpose | Source |
|---|---|---|
| `block-docs` | Create, refresh, and audit system documentation by ownership block | [kolezka/block-docs](https://github.com/kolezka/block-docs) |

**Plugin access:** This catalog is public, but `block-docs` is currently a private
repository. Installing it requires Git credentials with access to that repository.
Public access to this marketplace does not grant access to a private plugin.
Never put credentials in the marketplace manifest.

## Use block-docs

Open Claude Code in the repository you want to document, then run:

```text
/block-docs:block-docs Create documentation for this repository under docs/.
Read the source at HEAD, identify ownership boundaries, and document each block.
Do not commit or push.
```

See the plugin's README for its requirements and full workflow. The plugin owns
its agent, skill, templates, and validation tools; this marketplace does not copy
or modify those components.

If you already installed the same plugin from its standalone marketplace,
remove that installation before switching to this catalog:

```text
/plugin uninstall block-docs@block-docs
/plugin install block-docs@kolezka
/reload-plugins
```

## Update

From a terminal, refresh the catalog and then the installed plugin:

```sh
claude plugin marketplace update kolezka
claude plugin update block-docs@kolezka
```

Run `/reload-plugins` in active Claude Code sessions to apply plugin changes.
Plugin releases and version numbers belong to the source plugin repository.

## Add a plugin

Add an entry to the `plugins` array in `.claude-plugin/marketplace.json`:

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

Replace the example name and repository with an actual plugin. The entry name must
match the plugin's own `.claude-plugin/plugin.json` name. Its repository must
contain a valid plugin manifest and its advertised components.

Validate the catalog before committing:

```sh
claude plugin validate .claude-plugin/marketplace.json --strict
```

Manifest validation checks catalog structure, not source access or plugin behavior.
Test installation separately. A catalog entry follows `main`; use an explicit
release ref or commit pin if you need a fixed source revision.

## Reference

- [Create plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins)
