// Forwards to `claude-plugins-dsh sync`; dsh-compat/sync.sh calls this.
import { forward } from './forward.mjs'

forward(['sync', ...process.argv.slice(2)])
