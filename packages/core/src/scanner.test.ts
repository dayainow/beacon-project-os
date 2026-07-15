import assert from "node:assert/strict";
import test from "node:test";
import { evaluateProjectHealth, type ProjectObservation } from "./scanner.js";

test("explains missing project foundations with evidence and next actions", () => {
  const observation: ProjectObservation = {
    files: {
      total: 2,
      source: 0,
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
