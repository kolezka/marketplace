// Print what each plugin's dsh/ adapter registers, using the published CLI.
// Install the adapter's own dependencies first (cd <plugin>/dsh && bun install --frozen-lockfile).
//   node dsh-compat/inspect.mjs <plugin-dir>...
import { forward } from './forward.mjs'

forward(['inspect', ...process.argv.slice(2)])
