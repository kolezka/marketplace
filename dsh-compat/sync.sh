#!/bin/sh
# Kept for old callers. Adapters now depend on the published claude-plugin-dsh package,
# so there is no runtime to copy. --check verifies the direct-dependency shape instead.
#   dsh-compat/sync.sh --check <plugin-dir>...
set -eu
here=$(cd "$(dirname "$0")" && pwd)
if [ "${1-}" = --check ]; then
  shift
  exec node "$here/check.mjs" "$@"
fi
cat >&2 <<'MSG'
dsh-compat: sync is retired. Adapters import claude-plugin-dsh as a direct dependency,
so no runtime is copied. Update an adapter with `bun add --exact claude-plugin-dsh@<version>`
in its dsh/ directory and commit dsh/package.json and dsh/bun.lock.
Use `dsh-compat/sync.sh --check <plugin-dir>...` to verify the adapter shape.
MSG
exit 64
