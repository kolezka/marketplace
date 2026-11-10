// Kept for old callers: forwards to `claude-plugins-dsh inspect`.
//   node dsh-compat/inspect.mjs <plugin-dir>...
import { forward } from './forward.mjs'

forward(['inspect', ...process.argv.slice(2)])
