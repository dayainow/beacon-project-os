import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export * from "./scanner.js";
export * from "./history.js";
export * from "./process.js";
export * from "./projectBook.js";

export const BEACON_DIRECTORY = ".beacon";
export const CONFIG_VERSION = 1;

export interface BeaconConfig {
  version: typeof CONFIG_VERSION;
  initializedAt: string;
}

export interface ProjectIdentity {
  name: string;
  root: string;
  gitBranch: string | null;
  gitHead: string | null;
  initializedAt: string;
}

export interface InitializeResult {
  config: BeaconConfig;
  created: boolean;
  configPath: string;
}

function configPath(root: string): string {
  return path.join(path.resolve(root), BEACON_DIRECTORY, "project.json");
}

async function readPackageName(root: string): Promise<string | null> {
  try {
    const contents = await readFile(path.join(root, "package.json"), "utf8");
    const value = JSON.parse(contents) as { name?: unknown };
    return typeof value.name === "string" && value.name.trim() ? value.name.trim() : null;
  } catch {
    return null;
  }
}

function readGit(root: string, args: string[]): string | null {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || null;
  } catch {
    return null;
  }
}

export async function readConfig(root: string): Promise<BeaconConfig> {
  const contents = await readFile(configPath(root), "utf8");
  const value = JSON.parse(contents) as Partial<BeaconConfig>;

  if (value.version !== CONFIG_VERSION || typeof value.initializedAt !== "string") {
    throw new Error("지원하지 않는 Beacon 설정입니다. 다시 초기화하거나 마이그레이션하세요.");
  }

  return value as BeaconConfig;
}

export async function initializeProject(
  root: string,
  now = new Date(),
): Promise<InitializeResult> {
  const resolvedRoot = path.resolve(root);

  try {
    const config = await readConfig(resolvedRoot);
    return { config, created: false, configPath: configPath(resolvedRoot) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const directory = path.join(resolvedRoot, BEACON_DIRECTORY);
  const config: BeaconConfig = {
    version: CONFIG_VERSION,
    initializedAt: now.toISOString(),
  };

  await mkdir(directory, { recursive: true });
  await writeFile(configPath(resolvedRoot), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  await writeFile(path.join(directory, ".gitignore"), "cache/\nbeacon.db*\n*.log\n", "utf8");

  return { config, created: true, configPath: configPath(resolvedRoot) };
}

export async function readProjectIdentity(root: string): Promise<ProjectIdentity> {
  const resolvedRoot = path.resolve(root);
  const config = await readConfig(resolvedRoot);

  return {
    name: (await readPackageName(resolvedRoot)) ?? path.basename(resolvedRoot),
    root: resolvedRoot,
    gitBranch: readGit(resolvedRoot, ["branch", "--show-current"]),
    gitHead: readGit(resolvedRoot, ["rev-parse", "--short", "HEAD"]),
    initializedAt: config.initializedAt,
  };
}
