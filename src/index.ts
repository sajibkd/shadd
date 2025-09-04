#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { detect } from "package-manager-detector/detect";

type SupportedPackageManager = "pnpm" | "npm" | "yarn" | "bun";

function isGitRepo(directory: string): boolean {
  // Walk up until filesystem root or no .git and no enclosing repo
  let current: string | null = directory;
  // To avoid infinite loops
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const gitPath = path.join(current, ".git");
    if (fs.existsSync(gitPath)) {
      return true;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return false;
}

// Package manager detection is delegated to `package-manager-detector`.

async function runShadcnAdd(manager: SupportedPackageManager, forwardedArgs: readonly string[]): Promise<number> {
  // Map to the correct runner
  let command: string;
  let args: string[];

  switch (manager) {
    case "pnpm":
      command = "pnpm";
      args = ["dlx", "shadcn@latest", "add", ...forwardedArgs];
      break;
    case "npm":
      command = "npx";
      args = ["shadcn@latest", "add", ...forwardedArgs];
      break;
    case "yarn":
      command = "yarn";
      args = ["shadcn@latest", "add", ...forwardedArgs];
      break;
    case "bun":
      command = "bunx";
      args = ["--bun", "shadcn@latest", "add", ...forwardedArgs];
      break;
    default:
      // Should be unreachable due to type
      throw new Error("Unsupported package manager");
  }

  const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  return await new Promise<number>((resolve) => {
    child.on("close", (code) => resolve(code ?? 1));
  });
}

function getCwd(): string {
  return process.cwd();
}

async function main(): Promise<void> {
  // Forward all args after the binary name. If user typed `shadd add ...`,
  // drop the leading `add` so we don't end up duplicating it.
  const rawArgs = process.argv.slice(2);
  const forwarded = rawArgs.length > 0 && rawArgs[0] === "add" ? rawArgs.slice(1) : rawArgs;
  const cwd = getCwd();
  const withinRepo = isGitRepo(cwd);

  if (!withinRepo) {
    console.error(
      "Error: Not inside an active git repository. Run this inside a repository with shadcn initialized (see https://ui.shadcn.com/docs/cli#init)."
    );
    process.exit(1);
    return;
  }

  const detected = await detect();
  const manager = detected?.agent as SupportedPackageManager | undefined;
  if (!manager || !["pnpm", "npm", "yarn", "bun"].includes(manager)) {
    console.error(
      "Error: No package manager detected. Ensure your project is initialized and a supported package manager is used."
    );
    process.exit(1);
    return;
  }

  const exitCode = await runShadcnAdd(manager, forwarded);
  process.exit(exitCode);
}

// Top-level run with robust error surface
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Unexpected error:", message);
  process.exit(1);
});


