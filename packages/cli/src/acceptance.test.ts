import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const cliPath = fileURLToPath(new URL("./index.js", import.meta.url));

test("beacon init → beacon open → project identity", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-acceptance-"));
  await writeFile(path.join(root, "package.json"), '{"name":"observed-project"}\n', "utf8");
  await writeFile(path.join(root, "README.md"), "# Observed Project\n", "utf8");
  await mkdir(path.join(root, "docs"));
  await writeFile(path.join(root, "docs", "PRODUCT.md"), "# Product\n", "utf8");

  const initializedGit = spawnSync("git", ["-C", root, "init"], { encoding: "utf8" });
  assert.equal(initializedGit.status, 0, initializedGit.stderr);

  const initialized = spawnSync(process.execPath, [cliPath, "init", "--root", root], {
    encoding: "utf8",
  });
  assert.equal(initialized.status, 0, initialized.stderr);
  assert.equal(JSON.parse(initialized.stdout).created, true);

  const committed = spawnSync("git", [
    "-C",
    root,
    "-c",
    "user.name=Beacon Test",
    "-c",
    "user.email=beacon@example.com",
    "add",
    ".",
  ], { encoding: "utf8" });
  assert.equal(committed.status, 0, committed.stderr);
  const firstCommit = spawnSync("git", [
    "-C",
    root,
    "-c",
    "user.name=Beacon Test",
    "-c",
    "user.email=beacon@example.com",
    "commit",
    "-m",
    "docs: establish project baseline",
  ], { encoding: "utf8" });
  assert.equal(firstCommit.status, 0, firstCommit.stderr);
  await writeFile(path.join(root, "README.md"), "# Observed Project\n\nWork in progress.\n", "utf8");

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

  const snapshotResponse = await fetch(`${url}/api/snapshot`);
  assert.equal(snapshotResponse.status, 200);
  const snapshot = await snapshotResponse.json() as {
    observation: {
      files: { artifacts: Array<{ path: string }> };
      git: {
        changedFiles: Array<{ path: string }>;
        recentCommits: Array<{ subject: string }>;
      };
    };
    health: {
      signals: Array<{ id: string; level: string; evidence: string[]; sources: string[]; nextAction: string }>;
    };
  };
  assert.ok(snapshot.observation.files.artifacts.some((artifact) => artifact.path === "README.md"));
  assert.ok(snapshot.observation.files.artifacts.some((artifact) => artifact.path === "docs/PRODUCT.md"));
  assert.equal(snapshot.observation.git.recentCommits[0].subject, "docs: establish project baseline");
  assert.ok(snapshot.observation.git.changedFiles.some((change) => change.path === "README.md"));
  const architectureSignal = snapshot.health.signals.find((signal) => signal.id === "project-architecture");
  assert.equal(architectureSignal?.level, "warning");
  assert.ok(architectureSignal?.evidence.length);
  assert.ok(architectureSignal?.sources.length);
  assert.ok(architectureSignal?.nextAction.length);

  const dashboardResponse = await fetch(url);
  assert.equal(dashboardResponse.status, 200);
  const dashboard = await dashboardResponse.text();
  assert.match(dashboard, /Project Identity/);
  assert.match(dashboard, /Beacon Signals/);
  assert.match(dashboard, /\/api\/snapshot/);
});
