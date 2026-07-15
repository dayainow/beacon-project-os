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
