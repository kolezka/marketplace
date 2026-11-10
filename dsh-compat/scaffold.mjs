// Kept for old callers: forwards to `claude-plugins-dsh scaffold --scope @kolezka`.
//   node dsh-compat/scaffold.mjs <plugin-dir>...
import { forward } from './forward.mjs'

forward(['scaffold', '--scope', '@kolezka', ...process.argv.slice(2)])
