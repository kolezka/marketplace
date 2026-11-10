#!/bin/sh
# Kept for old callers: forwards to `claude-plugins-dsh sync`.
#   dsh-compat/sync.sh [--check] <plugin-dir>...
set -eu
here=$(cd "$(dirname "$0")" && pwd)
exec node "$here/sync.mjs" "$@"
