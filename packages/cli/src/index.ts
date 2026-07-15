#!/usr/bin/env node

import { initializeProject, readProjectIdentity } from "@beacon/core";
import { startBeaconRuntime } from "@beacon/runtime";
import { spawn } from "node:child_process";
import path from "node:path";

interface ParsedArguments {
  command: string | undefined;
  root: string;
  port: number;
  openBrowser: boolean;
}

function parseArguments(argv: string[]): ParsedArguments {
  const [command, ...rest] = argv;
  let root = process.cwd();
  let port = 4300;
  let openBrowser = true;

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === "--root") {
      root = path.resolve(rest[++index] ?? "");
    } else if (argument === "--port") {
      port = Number(rest[++index]);
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("올바른 포트를 입력하세요.");
    } else if (argument === "--no-browser") {
      openBrowser = false;
    } else {
      throw new Error(`알 수 없는 옵션입니다: ${argument}`);
    }
  }

  return { command, root, port, openBrowser };
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
  beacon identity [--root PATH]`);
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

  printHelp();
  if (options.command) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

