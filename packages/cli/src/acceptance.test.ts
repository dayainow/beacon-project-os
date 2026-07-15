import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const cliPath = fileURLToPath(new URL("./index.js", import.meta.url));

test("beacon init → beacon open → project identity", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-acceptance-"));
  await writeFile(path.join(root, "package.json"), '{"name":"observed-project"}\n', "utf8");

  const initialized = spawnSync(process.execPath, [cliPath, "init", "--root", root], {
    encoding: "utf8",
  });
  assert.equal(initialized.status, 0, initialized.stderr);
  assert.equal(JSON.parse(initialized.stdout).created, true);

  const child = spawn(process.execPath, [
    cliPath,
    "open",
    "--root",
    root,
    "--port",
    "0",
    "--no-browser",
  ], { stdio: ["ignore", "pipe", "pipe"] });
  context.after(() => child.kill("SIGTERM"));

  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => { stderr += chunk; });

  const url = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`runtime start timeout: ${stderr}`)), 5_000);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      const match = chunk.match(/Beacon is open at (http:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`runtime exited early (${code}): ${stderr}`));
    });
  });

  const identityResponse = await fetch(`${url}/api/identity`);
  assert.equal(identityResponse.status, 200);
  const identity = await identityResponse.json() as { name: string; root: string };
  assert.equal(identity.name, "observed-project");
  assert.equal(identity.root, root);

  const dashboardResponse = await fetch(url);
  assert.equal(dashboardResponse.status, 200);
  assert.match(await dashboardResponse.text(), /Project Identity/);
});

