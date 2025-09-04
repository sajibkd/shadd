# shadd

Global shorthand for `shadcn add` with automatic package manager detection.

`shadd` forwards all flags and arguments directly to `shadcn@latest add`, while detecting your package manager (npm, pnpm, yarn, bun, or deno) so you don't have to remember which runner to use. Detection is powered by `package-manager-detector`.

Requires running inside a git repository with shadcn initialized first. See the shadcn init docs: [`ui.shadcn.com/docs/cli#init`](https://ui.shadcn.com/docs/cli#init).

## Install (global)

```bash
npm i -g shadd
# or
pnpm add -g shadd
# or
yarn global add shadd
# or
bun add -g shadd
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

# Pass-through flags (examples)
shadd -y --overwrite button

# Using registries (names, URLs, or local paths are supported by shadcn)
shadd @8bitcn/accordion
shadd https://example.com/registry/components/button.json
```

Under the hood, `shadd` maps to the right runner automatically:

- pnpm: `pnpm dlx shadcn@latest add ...`
- npm: `npx shadcn@latest add ...`
- yarn: `yarn shadcn@latest add ...`
- bun: `bunx --bun shadcn@latest add ...`
- deno: `deno run -A npm:shadcn@latest add ...`

## Notes

- Must be run inside an active git repository; otherwise, `shadd` will exit with an error.
- If a supported package manager cannot be detected, `shadd` will exit with an error.
- Package manager detection is provided by `package-manager-detector` ([repo](https://github.com/antfu-collective/package-manager-detector), [README](https://raw.githubusercontent.com/antfu-collective/package-manager-detector/refs/heads/main/README.md)).

## License

MIT © Brandon McConnell
