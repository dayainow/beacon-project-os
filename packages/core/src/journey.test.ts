import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { initializeProject } from "./index.js";
import { completeProjectCycle, readProjectJourney, startProjectCycle } from "./journey.js";
import { scanProject } from "./scanner.js";

test("starts a versioned project cycle from the current snapshot baseline", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-journey-"));
  await writeFile(path.join(root, "README.md"), "# Journey Project\n", "utf8");
  await initializeProject(root, new Date("2026-07-15T00:00:00.000Z"));

  assert.deepEqual(await readProjectJourney(root), { version: 1, cycles: [] });

  const snapshot = await scanProject(root, new Date("2026-07-15T01:00:00.000Z"));
  const cycle = await startProjectCycle(root, {
    name: " 1차 상품 목록 MVP ",
    goal: " 상품을 탐색할 수 있는 첫 흐름을 만든다. ",
    snapshot,
    snapshotId: 7,
    now: new Date("2026-07-15T01:05:00.000Z"),
  });

  assert.equal(cycle.id, "cycle-001");
  assert.equal(cycle.sequence, 1);
  assert.equal(cycle.name, "1차 상품 목록 MVP");
  assert.equal(cycle.goal, "상품을 탐색할 수 있는 첫 흐름을 만든다.");
  assert.equal(cycle.status, "active");
  assert.equal(cycle.baseline.snapshotId, 7);
  assert.deepEqual(cycle.baseline.artifactPaths, ["README.md"]);

  const stored = JSON.parse(await readFile(path.join(root, ".beacon", "journey.json"), "utf8"));
  assert.deepEqual(stored, await readProjectJourney(root));

  await assert.rejects(
    startProjectCycle(root, {
      name: "2차",
      goal: "다음 목표",
      snapshot,
      snapshotId: 8,
    }),
    /이미 진행 중인 Cycle/,
  );
});

test("completes the active cycle with a start-to-end summary and allows a next cycle", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-journey-complete-"));
  await writeFile(path.join(root, "README.md"), "# Journey Project\n", "utf8");
  await initializeProject(root, new Date("2026-07-15T00:00:00.000Z"));

  const startSnapshot = await scanProject(root, new Date("2026-07-15T01:00:00.000Z"));
  await startProjectCycle(root, {
    name: "1차",
    goal: "첫 흐름",
    snapshot: startSnapshot,
    snapshotId: 1,
    now: new Date("2026-07-15T01:05:00.000Z"),
  });

  // 종료 전에 산출물을 추가해 시작↔종료 사이 변화를 만든다.
  await writeFile(path.join(root, "PRODUCT.md"), "# Product\n", "utf8");
  const endSnapshot = await scanProject(root, new Date("2026-07-16T09:00:00.000Z"));

  const completed = await completeProjectCycle(root, {
    startSnapshot,
    endSnapshot,
    endSnapshotId: 2,
    summary: " 첫 흐름을 마쳤다. ",
    now: new Date("2026-07-16T09:05:00.000Z"),
  });

  assert.equal(completed.status, "completed");
  assert.equal(completed.completedAt, "2026-07-16T09:05:00.000Z");
  assert.equal(completed.summary, "첫 흐름을 마쳤다.");
  assert.ok(completed.result, "완료 Cycle은 시작↔종료 요약을 가진다");
  assert.equal(completed.result?.endSnapshotId, 2);
  assert.equal(completed.result?.artifactsAdded, 1);
  assert.equal(completed.result?.artifactsModified, 0);
  assert.equal(completed.result?.artifactsDeleted, 0);
  assert.deepEqual(completed.result?.healthBefore, {
    score: startSnapshot.health.score,
    status: startSnapshot.health.status,
  });
  assert.deepEqual(completed.result?.healthAfter, {
    score: endSnapshot.health.score,
    status: endSnapshot.health.status,
  });

  const stored = await readProjectJourney(root);
  assert.equal(stored.cycles.length, 1);
  assert.deepEqual(stored.cycles[0], completed);

  // 종료 후에는 새 Cycle을 시작할 수 있고 순번이 이어진다.
  const next = await startProjectCycle(root, {
    name: "2차",
    goal: "다음 흐름",
    snapshot: endSnapshot,
    snapshotId: 2,
    now: new Date("2026-07-16T10:00:00.000Z"),
  });
  assert.equal(next.sequence, 2);
  assert.equal(next.id, "cycle-002");
});

test("rejects completion when no cycle is active", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-journey-noactive-"));
  await writeFile(path.join(root, "README.md"), "# Journey Project\n", "utf8");
  await initializeProject(root, new Date("2026-07-15T00:00:00.000Z"));

  const snapshot = await scanProject(root, new Date("2026-07-15T01:00:00.000Z"));
  await assert.rejects(
    completeProjectCycle(root, {
      startSnapshot: snapshot,
      endSnapshot: snapshot,
      endSnapshotId: 1,
    }),
    /진행 중인 Cycle이 없습니다/,
  );
});
