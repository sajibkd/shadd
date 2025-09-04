# shadd ⊕

![npm version](https://img.shields.io/npm/v/shadd?color=informational) <!-- ![npm downloads](https://img.shields.io/npm/dm/shadd) --> ![license](https://img.shields.io/badge/license-MIT-green)

Global shorthand for `shadcn add` with automatic package manager detection.

`shadd` forwards all flags and arguments directly to `shadcn@latest add`, while detecting your package manager (npm, pnpm, yarn, bun, or deno) so you don't have to remember which runner to use. Detection is powered by `package-manager-detector`.

```diff
Before
- pnpm dlx shadcn@latest add
- npx shadcn@latest add
- yarn shadcn@latest add
- bunx --bun shadcn@latest add
- deno run -A npm:shadcn@latest add

After
+ shadd
```

## Why?

- **One command, any package manager**: Auto-detects npm, pnpm, yarn, bun, or deno and runs the correct `shadcn add` variant for you.
- **No new flags to learn**: Everything after `shadd` is passed straight through to `shadcn add`.
- **Monorepo-friendly**: Uses `package-manager-detector` to crawl upwards and detect the right tool for the nearest repository root.

## Install (global)

```bash
npm i -g shadd@latest
# or
pnpm add -g shadd@latest
# or
yarn global add shadd@latest
# or
bun add -g shadd@latest
```

## Usage

All options are passed through to `shadcn add` exactly as-is.

```bash
# Wizard mode (interactive prompts)
shadd

# Add a single component
shadd button

# Add multiple components
shadd button card dialog

# Pass-through flags (examples; all flags pass through to shadcn add)
shadd -y --overwrite button

# Using registries (names, URLs, or local paths are supported by shadcn)
shadd @8bitcn/accordion
shadd https://example.com/registry/components/button.json
```

Under the hood, `shadd` maps to the correct package manager command automatically:

- pnpm: `pnpm dlx shadcn@latest add ...`
- npm: `npx shadcn@latest add ...`
- yarn: `yarn shadcn@latest add ...`
- bun: `bunx --bun shadcn@latest add ...`
- deno: `deno run -A npm:shadcn@latest add ...`

## Notes

- Must be run inside an active git repository; otherwise, `shadd` will exit with an error.
- If a supported package manager cannot be detected, `shadd` will exit with an error.
- Package manager detection is provided by [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector).

## License

MIT © Brandon McConnell
