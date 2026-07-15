import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { initializeProject } from "./index.js";
import { readProjectJourney, startProjectCycle } from "./journey.js";
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
