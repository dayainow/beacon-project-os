import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, unlink, utimes, writeFile } from "node:fs/promises";
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

  const cycleStarted = spawnSync(process.execPath, [
    cliPath,
    "cycle",
    "start",
    "1차 상품 목록 MVP",
    "--goal",
    "고객이 상품 목록을 탐색할 수 있게 한다.",
    "--root",
    root,
  ], { encoding: "utf8" });
  assert.equal(cycleStarted.status, 0, cycleStarted.stderr);
  const startedCycle = JSON.parse(cycleStarted.stdout) as {
    id: string;
    name: string;
    goal: string;
    status: string;
    baseline: { snapshotId: number; artifactPaths: string[] };
  };
  assert.equal(startedCycle.id, "cycle-001");
  assert.equal(startedCycle.name, "1차 상품 목록 MVP");
  assert.equal(startedCycle.goal, "고객이 상품 목록을 탐색할 수 있게 한다.");
  assert.equal(startedCycle.status, "active");
  assert.equal(startedCycle.baseline.snapshotId, 1);
  assert.ok(startedCycle.baseline.artifactPaths.includes("README.md"));

  const cycleStatus = spawnSync(process.execPath, [cliPath, "cycle", "status", "--root", root], {
    encoding: "utf8",
  });
  assert.equal(cycleStatus.status, 0, cycleStatus.stderr);
  assert.equal((JSON.parse(cycleStatus.stdout) as { cycles: unknown[] }).cycles.length, 1);

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
    timeline: {
      events: Array<{
        type: string;
        category: string;
        title: string;
        reference: string;
        occurredAt: string;
        relatedArtifacts: string[];
      }>;
      total: number;
      truncated: boolean;
    };
    persistence: {
      recorded: boolean;
      baseline: boolean;
      snapshotCount: number;
      changeCount: number;
    };
    process: {
      currentStageId: string | null;
      readyStages: number;
      stages: Array<{
        id: string;
        state: string;
        gate: {
          status: string;
          requirements: Array<{ id: string; satisfied: boolean; evidence: string[]; sources: string[]; nextAction: string }>;
        };
      }>;
    };
  };
  assert.ok(snapshot.observation.files.artifacts.some((artifact) => artifact.path === "README.md"));
  assert.ok(snapshot.observation.files.artifacts.some((artifact) => artifact.path === "docs/PRODUCT.md"));
  assert.equal(snapshot.observation.git.recentCommits[0].subject, "docs: establish project baseline");
  assert.ok(snapshot.observation.git.changedFiles.some((change) => change.path === "README.md"));
  assert.ok(snapshot.observation.git.changedFiles.every((change) => !change.path.startsWith(".beacon/")));
  const architectureSignal = snapshot.health.signals.find((signal) => signal.id === "project-architecture");
  assert.equal(architectureSignal?.level, "warning");
  assert.ok(architectureSignal?.evidence.length);
  assert.ok(architectureSignal?.sources.length);
  assert.ok(architectureSignal?.nextAction.length);
  assert.ok(snapshot.timeline.events.some((event) => event.type === "artifact" && event.reference === "README.md"));
  const baselineEvent = snapshot.timeline.events.find((event) => (
    event.type === "commit"
    && event.category === "documentation"
    && event.title === "docs: establish project baseline"
  ));
  assert.ok(baselineEvent);
  assert.ok(baselineEvent.relatedArtifacts.includes("README.md"));
  assert.ok(baselineEvent.relatedArtifacts.includes("docs/PRODUCT.md"));
  assert.ok(snapshot.timeline.events.every((event, index, events) => (
    index === 0 || Date.parse(events[index - 1].occurredAt) >= Date.parse(event.occurredAt)
  )));
  assert.equal(snapshot.persistence.recorded, false);
  assert.equal(snapshot.persistence.baseline, false);
  assert.equal(snapshot.persistence.snapshotCount, 1);
  assert.equal(snapshot.process.currentStageId, "p1");
  assert.equal(snapshot.process.stages[0].gate.status, "ready");
  const designRequirement = snapshot.process.stages[1].gate.requirements[0];
  assert.equal(designRequirement.id, "p1-architecture");
  assert.equal(designRequirement.satisfied, false);
  assert.ok(designRequirement.evidence.length);
  assert.ok(designRequirement.sources.length);
  assert.ok(designRequirement.nextAction.length);

  const unchangedResponse = await fetch(`${url}/api/snapshot`);
  const unchanged = await unchangedResponse.json() as { persistence: { recorded: boolean; snapshotCount: number } };
  assert.equal(unchanged.persistence.recorded, false);
  assert.equal(unchanged.persistence.snapshotCount, 1);

  const journeyResponse = await fetch(`${url}/api/journey`);
  assert.equal(journeyResponse.status, 200);
  const journey = await journeyResponse.json() as {
    cycles: Array<{ name: string; status: string; baseline: { snapshotId: number } }>;
  };
  assert.equal(journey.cycles[0].name, "1차 상품 목록 MVP");
  assert.equal(journey.cycles[0].status, "active");
  assert.equal(journey.cycles[0].baseline.snapshotId, 1);

  await writeFile(path.join(root, "README.md"), "# Observed Project\n\nReady for review.\n", "utf8");
  await utimes(path.join(root, "README.md"), new Date("2026-07-15T12:00:00.000Z"), new Date("2026-07-15T12:00:00.000Z"));
  await unlink(path.join(root, "docs", "PRODUCT.md"));
  await writeFile(path.join(root, "docs", "PRD.md"), "# Replacement Plan\n", "utf8");
  await utimes(path.join(root, "docs", "PRD.md"), new Date("2026-07-15T12:00:30.000Z"), new Date("2026-07-15T12:00:30.000Z"));
  await writeFile(path.join(root, "docs", "ARCHITECTURE.md"), "# Architecture\n", "utf8");
  await utimes(path.join(root, "docs", "ARCHITECTURE.md"), new Date("2026-07-15T12:01:00.000Z"), new Date("2026-07-15T12:01:00.000Z"));

  const changedResponse = await fetch(`${url}/api/snapshot`);
  const changed = await changedResponse.json() as {
    persistence: {
      recorded: boolean;
      baseline: boolean;
      snapshotCount: number;
      changes: Array<{ kind: string; entity: string; reference: string }>;
    };
    process: { currentStageId: string | null };
  };
  assert.equal(changed.persistence.recorded, true);
  assert.equal(changed.persistence.baseline, false);
  assert.equal(changed.persistence.snapshotCount, 2);
  assert.equal(changed.process.currentStageId, "p2");
  assert.deepEqual(
    changed.persistence.changes
      .filter((change) => change.entity === "artifact")
      .map(({ kind, reference }) => ({ kind, reference })),
    [
      { kind: "added", reference: "docs/ARCHITECTURE.md" },
      { kind: "added", reference: "docs/PRD.md" },
      { kind: "deleted", reference: "docs/PRODUCT.md" },
      { kind: "modified", reference: "README.md" },
    ],
  );

  const historyResponse = await fetch(`${url}/api/history`);
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json() as {
    snapshotCount: number;
    changeCount: number;
    timelineCount: number;
    changes: Array<{ kind: string }>;
  };
  assert.equal(history.snapshotCount, 2);
  assert.equal(history.changeCount, 4);
  assert.equal(history.changes.length, 4);
  assert.ok(history.timelineCount >= 3);

  const exported = spawnSync(process.execPath, [
    cliPath,
    "export",
    "--root",
    root,
    "--output",
    "docs/PROJECT_BOOK.md",
  ], { encoding: "utf8" });
  assert.equal(exported.status, 0, exported.stderr);
  const exportResult = JSON.parse(exported.stdout) as {
    outputPath: string;
    snapshotCount: number;
    changeCount: number;
    timelineCount: number;
  };
  assert.equal(exportResult.outputPath, path.join(root, "docs", "PROJECT_BOOK.md"));
  assert.equal(exportResult.snapshotCount, 2);
  assert.equal(exportResult.changeCount, 4);
  assert.ok(exportResult.timelineCount >= 3);

  const projectBook = await readFile(exportResult.outputPath, "utf8");
  assert.match(projectBook, /^# observed-project Project Book/m);
  assert.match(projectBook, /## P0–P4 Gate 준비도/);
  assert.match(projectBook, /`docs\/ARCHITECTURE\.md`/);
  assert.match(projectBook, /## 스캔 사이의 변화/);
  assert.match(projectBook, /## Project Timeline/);
  assert.doesNotMatch(projectBook, new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const defaultExport = spawnSync(process.execPath, [cliPath, "export", "--root", root], {
    encoding: "utf8",
  });
  assert.equal(defaultExport.status, 0, defaultExport.stderr);
  const defaultExportResult = JSON.parse(defaultExport.stdout) as {
    outputPath: string;
    snapshotCount: number;
    changeCount: number;
  };
  assert.equal(defaultExportResult.outputPath, path.join(root, "PROJECT_BOOK.md"));
  assert.equal(defaultExportResult.snapshotCount, 2);
  assert.equal(defaultExportResult.changeCount, 4);
  assert.match(await readFile(defaultExportResult.outputPath, "utf8"), /^# observed-project Project Book/m);

  const dashboardResponse = await fetch(url);
  assert.equal(dashboardResponse.status, 200);
  const dashboard = await dashboardResponse.text();
  assert.match(dashboard, /Project Identity/);
  assert.match(dashboard, /Beacon Signals/);
  assert.match(dashboard, /P0–P4 Process/);
  assert.match(dashboard, /Gate 준비도/);
  assert.match(dashboard, /Project Timeline/);
  assert.match(dashboard, /Append-only Activity/);
  assert.match(dashboard, /Project Journey/);
  assert.match(dashboard, /data-view-link="overview"/);
  assert.match(dashboard, /data-view-link="process"/);
  assert.match(dashboard, /data-view-link="artifacts"/);
  assert.match(dashboard, /data-view-link="history"/);
  assert.match(dashboard, /\/api\/snapshot/);
  assert.match(dashboard, /\/api\/history/);
  assert.match(dashboard, /\/api\/journey/);
});
