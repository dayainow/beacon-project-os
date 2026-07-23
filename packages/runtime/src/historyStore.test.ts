import assert from "node:assert/strict";
import { mkdir, mkdtemp, stat, unlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { scanProject } from "@beacon/core";
import { ProjectHistoryStore } from "./historyStore.js";

test("persists changed snapshots once and keeps append-only project history", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-history-"));
  await mkdir(path.join(root, ".beacon"));
  await mkdir(path.join(root, "docs"));
  await writeFile(path.join(root, "README.md"), "# Baseline\n", "utf8");
  await writeFile(path.join(root, "docs", "PRODUCT.md"), "# Product\n", "utf8");
  await utimes(path.join(root, "README.md"), new Date("2026-07-15T09:00:00.000Z"), new Date("2026-07-15T09:00:00.000Z"));
  await utimes(path.join(root, "docs", "PRODUCT.md"), new Date("2026-07-15T09:00:00.000Z"), new Date("2026-07-15T09:00:00.000Z"));

  const store = new ProjectHistoryStore(root);
  context.after(() => store.close());
  const baseline = await scanProject(root, new Date("2026-07-15T10:00:00.000Z"));
  const first = store.record(baseline);

  assert.equal(first.recorded, true);
  assert.equal(first.baseline, true);
  assert.equal(first.snapshotCount, 1);
  assert.equal(first.changeCount, 0);
  const unchangedRescan = await scanProject(root, new Date("2026-07-15T10:05:00.000Z"));
  assert.equal(store.record(unchangedRescan).recorded, false);
  assert.equal(store.history().snapshotCount, 1);

  await writeFile(path.join(root, "README.md"), "# Changed\n", "utf8");
  await utimes(path.join(root, "README.md"), new Date("2026-07-15T10:30:00.000Z"), new Date("2026-07-15T10:30:00.000Z"));
  await unlink(path.join(root, "docs", "PRODUCT.md"));
  await writeFile(path.join(root, "docs", "ARCHITECTURE.md"), "# Architecture\n", "utf8");
  await utimes(path.join(root, "docs", "ARCHITECTURE.md"), new Date("2026-07-15T10:40:00.000Z"), new Date("2026-07-15T10:40:00.000Z"));

  const changed = await scanProject(root, new Date("2026-07-15T11:00:00.000Z"));
  const second = store.record(changed);

  assert.equal(second.recorded, true);
  assert.equal(second.baseline, false);
  assert.equal(second.snapshotCount, 2);
  assert.deepEqual(
    second.changes.map(({ kind, reference }) => ({ kind, reference })),
    [
      { kind: "added", reference: "docs/ARCHITECTURE.md" },
      { kind: "deleted", reference: "docs/PRODUCT.md" },
      { kind: "modified", reference: "README.md" },
    ],
  );

  const history = store.history();
  assert.equal(history.snapshotCount, 2);
  assert.equal(history.changeCount, 3);
  assert.equal(history.timelineCount, 4);
  assert.equal(history.changes.length, 3);
  assert.equal(history.timeline.length, 4);
  assert.equal((await stat(store.databasePath)).isFile(), true);

  const returnedToBaseline = {
    ...baseline,
    scannedAt: "2026-07-15T12:00:00.000Z",
  };
  const third = store.record(returnedToBaseline);
  assert.equal(third.recorded, true);
  assert.equal(third.snapshotCount, 3);
  assert.deepEqual(
    third.changes.map(({ kind, reference }) => ({ kind, reference })),
    [
      { kind: "deleted", reference: "docs/ARCHITECTURE.md" },
      { kind: "added", reference: "docs/PRODUCT.md" },
      { kind: "modified", reference: "README.md" },
    ],
  );
  assert.equal(store.history().changeCount, 6);
});

test("recovers from a corrupt beacon.db instead of crashing", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-corrupt-"));
  await mkdir(path.join(root, ".beacon"));
  const dbPath = path.join(root, ".beacon", "beacon.db");
  // SQLite가 아닌 쓰레기 바이트를 심어 손상 상태를 만든다.
  await writeFile(dbPath, "NOT A VALID SQLITE FILE — corrupted bytes");

  // 예외 없이 열려야 한다(전에는 여기서 대시보드가 죽었다).
  const store = new ProjectHistoryStore(root);
  try {
    const snapshot = await scanProject(root, new Date("2026-07-23T00:00:00.000Z"));
    const result = store.record(snapshot);
    // 재생성된 DB가 정상 동작한다.
    assert.equal(result.recorded, true);
    assert.equal(store.history().snapshotCount, 1);
    // 손상 파일은 진단용으로 백업된다.
    const backup = await stat(dbPath + ".corrupt.bak").then(() => true).catch(() => false);
    const unreadableBackup = await stat(dbPath + ".unreadable.bak").then(() => true).catch(() => false);
    assert.ok(backup || unreadableBackup, "손상 DB는 .bak으로 보존되어야 한다");
  } finally {
    store.close();
  }
});

test("accumulates all timeline events, not just the displayed cap", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-accum-"));
  await mkdir(path.join(root, ".beacon"));
  // 표시 상한(30)을 넘는 이벤트를 담은 스냅샷을 만든다.
  const events = Array.from({ length: 45 }, (_, index) => ({
    id: `commit:hash${index}`,
    type: "commit" as const,
    category: "implementation" as const,
    occurredAt: new Date(Date.UTC(2026, 6, 1, 0, index)).toISOString(),
    title: `commit ${index}`,
    detail: "",
    source: "git",
    reference: `h${index}`,
    relatedArtifacts: [],
  }));
  const snapshot = {
    scannedAt: "2026-07-23T00:00:00.000Z",
    observation: {
      files: { total: 0, source: 0, tests: 0, config: 0, truncated: false, artifacts: [] },
      git: { isRepository: true, root, branch: "main", head: "abc", changedFiles: [], recentCommits: [] },
    },
    health: { status: "on_track", score: 100, passedChecks: 5, totalChecks: 5, headline: "", signals: [] },
    timeline: { events: events.slice(0, 30), total: events.length, truncated: true, all: events },
    process: { templateId: "beacon-default-p0-p4-v1", currentStageId: null, readyStages: 5, totalStages: 5, stages: [] },
  } as unknown as Parameters<ProjectHistoryStore["record"]>[0];

  const store = new ProjectHistoryStore(root);
  try {
    store.record(snapshot);
    // 표시는 30개로 잘려도 History에는 45개 전체가 쌓여야 한다.
    assert.equal(store.history().timelineCount, 45);
  } finally {
    store.close();
  }
});
