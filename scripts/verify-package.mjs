import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliRoot = path.join(repositoryRoot, "packages", "cli");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(args, cwd) {
  const result = spawnSync(pnpm, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, [result.stdout, result.stderr].filter(Boolean).join("\n"));
  return result.stdout;
}

async function openRuntime(projectRoot, consumerRoot) {
  const child = spawn(pnpm, [
    "exec",
    "beacon",
    "open",
    "--root",
    projectRoot,
    "--port",
    "0",
    "--no-browser",
  ], { cwd: consumerRoot, stdio: ["ignore", "pipe", "pipe"] });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });

  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`packaged runtime start timeout\n${stderr}`)), 10_000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const match = stdout.match(/Beacon is open at (http:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve(match[1]);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`packaged runtime exited early (${code})\n${stderr}`));
    });
  });

  return { child, url };
}

const temporaryRoot = await mkdtemp(path.join(tmpdir(), "beacon-package-"));

try {
  const artifactsRoot = path.join(temporaryRoot, "artifacts");
  const consumerRoot = path.join(temporaryRoot, "consumer");
  const projectRoot = path.join(temporaryRoot, "clean-project");
  await mkdir(artifactsRoot);
  await mkdir(consumerRoot);
  await mkdir(path.join(projectRoot, "docs"), { recursive: true });
  await writeFile(path.join(consumerRoot, "package.json"), '{"name":"beacon-clean-room","private":true}\n', "utf8");
  await writeFile(path.join(projectRoot, "package.json"), '{"name":"clean-beacon-project"}\n', "utf8");
  await writeFile(path.join(projectRoot, "README.md"), "# Clean Beacon Project\n", "utf8");
  await writeFile(path.join(projectRoot, "docs", "PRODUCT.md"), "# Product\n", "utf8");

  run(["pack", "--pack-destination", artifactsRoot], cliRoot);
  const archives = (await readdir(artifactsRoot)).filter((file) => file.endsWith(".tgz"));
  assert.deepEqual(archives, ["dayainow-beacon-0.1.0.tgz"]);
  const archivePath = path.join(artifactsRoot, archives[0]);

  run(["add", "--save-dev", "--offline", archivePath], consumerRoot);
  const initialized = JSON.parse(run(["exec", "beacon", "init", "--root", projectRoot], consumerRoot));
  assert.equal(initialized.created, true);
  assert.equal(initialized.config.version, 1);

  const identity = JSON.parse(run(["exec", "beacon", "identity", "--root", projectRoot], consumerRoot));
  assert.equal(identity.name, "clean-beacon-project");

  const runtime = await openRuntime(projectRoot, consumerRoot);
  try {
    const snapshotResponse = await fetch(`${runtime.url}/api/snapshot`);
    assert.equal(snapshotResponse.status, 200);
    const snapshot = await snapshotResponse.json();
    assert.ok(snapshot.observation.files.artifacts.some((artifact) => artifact.path === "README.md"));

    const dashboardResponse = await fetch(runtime.url);
    assert.equal(dashboardResponse.status, 200);
    assert.match(await dashboardResponse.text(), /Project Identity/);
  } finally {
    runtime.child.kill("SIGTERM");
    await Promise.race([once(runtime.child, "exit"), new Promise((resolve) => setTimeout(resolve, 2_000))]);
  }

  const exported = JSON.parse(run(["exec", "beacon", "export", "--root", projectRoot], consumerRoot));
  assert.equal(exported.outputPath, path.join(projectRoot, "PROJECT_BOOK.md"));
  assert.match(await readFile(exported.outputPath, "utf8"), /^# clean-beacon-project Project Book/m);

  console.log(`Packaged CLI clean-room verification passed: ${archives[0]}`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
