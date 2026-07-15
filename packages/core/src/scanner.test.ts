import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildProjectTimeline, evaluateProjectHealth, scanProject, type ProjectObservation } from "./scanner.js";

test("explains missing project foundations with evidence and next actions", () => {
  const observation: ProjectObservation = {
    files: {
      total: 2,
      source: 0,
      tests: 0,
      config: 1,
      truncated: false,
      artifacts: [{
        path: "fixtures/demo/README.md",
        name: "README.md",
        kind: "overview",
        modifiedAt: "2026-07-15T00:00:00.000Z",
        source: "filesystem",
      }],
    },
    git: {
      isRepository: false,
      root: null,
      branch: null,
      head: null,
      changedFiles: [],
      recentCommits: [],
    },
  };

  const health = evaluateProjectHealth(observation);

  assert.equal(health.status, "at_risk");
  assert.equal(health.score, 0);
  assert.equal(health.signals.length, 5);
  assert.equal(health.signals.find((signal) => signal.id === "project-overview")?.level, "warning");
  assert.ok(health.signals.every((signal) => signal.evidence.length > 0));
  assert.ok(health.signals.every((signal) => signal.sources.length > 0));
  assert.ok(health.signals.every((signal) => signal.nextAction.length > 0));
});

test("combines document changes and commits into a categorized chronological timeline", () => {
  const observation: ProjectObservation = {
    files: {
      total: 2,
      source: 0,
      tests: 0,
      config: 0,
      truncated: false,
      artifacts: [{
        path: "docs/PRODUCT.md",
        name: "PRODUCT.md",
        kind: "planning",
        modifiedAt: "2026-07-15T12:00:00.000Z",
        source: "filesystem",
      }],
    },
    git: {
      isRepository: true,
      root: "/project",
      branch: "main",
      head: "abcdef0",
      changedFiles: [{ path: "docs/PRODUCT.md", status: "M" }],
      recentCommits: [{
        hash: "abcdef0123456789",
        shortHash: "abcdef0",
        authoredAt: "2026-07-15T11:00:00.000Z",
        subject: "fix: resolve scanner boundary",
        paths: ["docs/PRODUCT.md", "packages/core/src/scanner.ts"],
      }],
    },
  };

  const timeline = buildProjectTimeline(observation);

  assert.equal(timeline.total, 2);
  assert.equal(timeline.events[0].type, "artifact");
  assert.equal(timeline.events[0].category, "planning");
  assert.equal(timeline.events[0].reference, "docs/PRODUCT.md");
  assert.equal(timeline.events[1].type, "commit");
  assert.equal(timeline.events[1].category, "issue");
  assert.equal(timeline.events[1].reference, "abcdef0");
  assert.deepEqual(timeline.events[1].relatedArtifacts, ["docs/PRODUCT.md"]);
});

test("counts common test source patterns for the P3 gate", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-tests-"));
  await mkdir(path.join(root, "src"));
  await mkdir(path.join(root, "tests"));
  await writeFile(path.join(root, "src", "index.ts"), "export const value = 1;\n", "utf8");
  await writeFile(path.join(root, "src", "index.test.ts"), "// test\n", "utf8");
  await writeFile(path.join(root, "tests", "api.spec.js"), "// test\n", "utf8");

  const snapshot = await scanProject(root, new Date("2026-07-15T10:00:00.000Z"));

  assert.equal(snapshot.observation.files.source, 3);
  assert.equal(snapshot.observation.files.tests, 2);
  assert.equal(snapshot.process.stages.find((stage) => stage.id === "p3")?.gate.status, "ready");
});
