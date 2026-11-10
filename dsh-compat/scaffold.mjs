// Retired. claude-plugin-dsh 0.1.0 scaffold writes a vendored runtime copy, and kolezka
// adapters now import the published package instead. Write dsh/ by hand (see README.md).
console.error(`dsh-compat: scaffold is retired. Adapters use claude-plugin-dsh as a direct dependency,
and the published scaffold command would write a vendored dsh/claude-compat.js.
Write dsh/package.json, dsh/index.js and dsh/cordis.patch.yml by hand as shown in
dsh-compat/README.md, then run \`bun install\` in dsh/ and commit dsh/bun.lock.`)
process.exit(64)
