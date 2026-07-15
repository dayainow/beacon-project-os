#!/usr/bin/env node

import {
  generateProjectBook,
  initializeProject,
  readProjectJourney,
  readProjectIdentity,
  scanProject,
  startProjectCycle,
} from "@beacon/core";
import { ProjectHistoryStore, startBeaconRuntime } from "@beacon/runtime";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

interface ParsedArguments {
  command: string | undefined;
  root: string;
  port: number;
  openBrowser: boolean;
  output: string | null;
  goal: string | null;
  positionals: string[];
}

function parseArguments(argv: string[]): ParsedArguments {
  const [command, ...rest] = argv;
  let root = process.cwd();
  let port = 4300;
  let openBrowser = true;
  let output: string | null = null;
  let goal: string | null = null;
  const positionals: string[] = [];

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === "--root") {
      root = path.resolve(rest[++index] ?? "");
    } else if (argument === "--port") {
      port = Number(rest[++index]);
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("올바른 포트를 입력하세요.");
    } else if (argument === "--no-browser") {
      openBrowser = false;
    } else if (argument === "--output") {
      output = rest[++index] ?? null;
      if (!output) throw new Error("내보낼 파일 경로를 입력하세요.");
    } else if (argument === "--goal") {
      goal = rest[++index] ?? null;
      if (!goal) throw new Error("Cycle 목표를 입력하세요.");
    } else if (!argument.startsWith("--")) {
      positionals.push(argument);
    } else {
      throw new Error(`알 수 없는 옵션입니다: ${argument}`);
    }
  }

  return { command, root, port, openBrowser, output, goal, positionals };
}

function openUrl(url: string): void {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.unref();
}

function printHelp(): void {
  console.log(`Beacon — local-first Project Navigation OS

Usage:
  beacon init [--root PATH]
  beacon open [--root PATH] [--port PORT] [--no-browser]
  beacon identity [--root PATH]
  beacon cycle start "CYCLE NAME" --goal "GOAL" [--root PATH]
  beacon cycle status [--root PATH]
  beacon export [--root PATH] [--output PATH]`);
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));

  if (options.command === "init") {
    const result = await initializeProject(options.root);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (options.command === "identity") {
    console.log(JSON.stringify(await readProjectIdentity(options.root), null, 2));
    return;
  }

  if (options.command === "open") {
    const runtime = await startBeaconRuntime(options);
    console.log(`Beacon is open at ${runtime.url}`);
    if (options.openBrowser) openUrl(runtime.url);
    return;
  }

  if (options.command === "cycle") {
    const [action, ...nameParts] = options.positionals;
    await readProjectIdentity(options.root);

    if (action === "status") {
      console.log(JSON.stringify(await readProjectJourney(options.root), null, 2));
      return;
    }

    if (action === "start") {
      const snapshot = await scanProject(options.root);
      const historyStore = new ProjectHistoryStore(options.root);
      let snapshotId: number;
      try {
        snapshotId = historyStore.record(snapshot).snapshotId;
      } finally {
        historyStore.close();
      }
      const cycle = await startProjectCycle(options.root, {
        name: nameParts.join(" "),
        goal: options.goal ?? "",
        snapshot,
        snapshotId,
      });
      console.log(JSON.stringify(cycle, null, 2));
      return;
    }

    throw new Error("사용법: beacon cycle start \"이름\" --goal \"목표\" 또는 beacon cycle status");
  }

  if (options.command === "export") {
    const identity = await readProjectIdentity(options.root);
    const snapshot = await scanProject(options.root);
    const historyStore = new ProjectHistoryStore(options.root);
    let history;
    try {
      historyStore.record(snapshot);
      history = historyStore.history(200);
    } finally {
      historyStore.close();
    }

    const outputPath = path.resolve(options.root, options.output ?? "PROJECT_BOOK.md");
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, generateProjectBook({ identity, snapshot, history }), "utf8");
    console.log(JSON.stringify({
      outputPath,
      snapshotCount: history.snapshotCount,
      changeCount: history.changeCount,
      timelineCount: history.timelineCount,
    }, null, 2));
    return;
  }

  printHelp();
  if (options.command) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
