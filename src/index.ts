#!/usr/bin/env node
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

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

function readPackageJsonIfPresent(targetDir: string): unknown | null {
  const pkgPath = path.join(targetDir, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  try {
    const content = fs.readFileSync(pkgPath, "utf8");
    return JSON.parse(content) as unknown;
  } catch {
    return null;
  }
}

function extractPackageManager(value: unknown): SupportedPackageManager | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith("pnpm")) return "pnpm";
  if (lower.startsWith("npm")) return "npm";
  if (lower.startsWith("yarn")) return "yarn";
  if (lower.startsWith("bun")) return "bun";
  return null;
}

function findNearestPackageManager(startDir: string): {
  manager: SupportedPackageManager | null;
  pkgDir: string | null;
} {
  // We only consider directories that are inside a git repository boundary.
  // If not inside a git repo, we return manager: null and pkgDir: null.
  if (!isGitRepo(startDir)) {
    return { manager: null, pkgDir: null };
  }

  let current: string | null = startDir;
  const repoRootGuard = new Set<string>();
  while (current && !repoRootGuard.has(current)) {
    repoRootGuard.add(current);
    // If we walk past the git boundary, stop
    if (!isGitRepo(current)) {
      break;
    }
    const pkg = readPackageJsonIfPresent(current);
    if (pkg && typeof pkg === "object" && pkg !== null) {
      const maybeManager = extractPackageManager((pkg as Record<string, unknown>)["packageManager"]);
      if (maybeManager) {
        return { manager: maybeManager, pkgDir: current };
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  // Exhausted git-contained dirs without finding explicit manager
  return { manager: null, pkgDir: null };
}

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
  const program = new Command();
  program
    .name("shadd")
    .description("Alias for 'shadcn add' with package manager auto-detection")
    .version("1.0.2")
    .usage("[options] [components...]")
    .allowUnknownOption(true)
    .argument("[components...]", "Components to add (forwarded)")
    .helpOption("-h, --help", "Display help for shadd")
    .option("--no-color", "Disable color output")
    .option("-y, --yes", "Skip prompts where supported")
    .option("-v, --verbose", "Verbose output")
    .action(async () => {
      const cwd = getCwd();
      const withinRepo = isGitRepo(cwd);

      if (!withinRepo) {
        console.error(
          "Error: Not inside an active git repository. Run this inside a repository with shadcn initialized."
        );
        process.exitCode = 1;
        return;
      }

      const { manager } = findNearestPackageManager(cwd);
      if (!manager) {
        console.error(
          "Error: No package manager detected. Ensure 'packageManager' is set in the nearest package.json within your repo."
        );
        process.exitCode = 1;
        return;
      }

      // Forward all args after the binary name. If user typed `shadd add ...`,
      // drop the leading `add` so we don't end up duplicating it.
      const rawArgs = process.argv.slice(2);
      const forwarded = rawArgs.length > 0 && rawArgs[0] === "add" ? rawArgs.slice(1) : rawArgs;
      const exitCode = await runShadcnAdd(manager, forwarded);
      process.exitCode = exitCode;
    });

  await program.parseAsync(process.argv);
}

// Top-level run with robust error surface
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Unexpected error:", message);
  process.exit(1);
});


