import assert from "node:assert/strict";
import test from "node:test";
import { assessProjectProcess } from "./process.js";
import type { ArtifactKind, ProjectObservation } from "./scanner.js";

function observation(kinds: ArtifactKind[], options: { source?: number; tests?: number; commits?: number } = {}): ProjectObservation {
  return {
    files: {
      total: kinds.length + (options.source ?? 0),
      source: options.source ?? 0,
      tests: options.tests ?? 0,
      config: 0,
      truncated: false,
      artifacts: kinds.map((kind, index) => ({
        path: kind === "overview" ? "README.md" : `docs/${kind.toUpperCase()}-${index}.md`,
        name: `${kind}.md`,
        kind,
        scope: "project",
        modifiedAt: "2026-07-15T10:00:00.000Z",
        source: "filesystem",
      })),
    },
    git: {
      isRepository: (options.commits ?? 0) > 0,
      root: "/project",
      branch: "main",
      head: "abcdef0",
      changedFiles: [],
      recentCommits: Array.from({ length: options.commits ?? 0 }, (_, index) => ({
        hash: `abcdef${index}123456789`,
        shortHash: `abcdef${index}`,
        authoredAt: "2026-07-15T10:00:00.000Z",
        subject: "feat: implementation",
        paths: ["src/index.ts"],
      })),
    },
  };
}

test("maps observed evidence to P0-P4 and points at the first missing gate", () => {
  const process = assessProjectProcess(observation(
    ["overview", "planning", "architecture"],
    { source: 8, tests: 2, commits: 1 },
  ));

  assert.equal(process.readyStages, 4);
  assert.equal(process.currentStageId, "p4");
  assert.deepEqual(process.stages.map(({ id, state, gate }) => ({ id, state, gate: gate.status })), [
    { id: "p0", state: "ready", gate: "ready" },
    { id: "p1", state: "ready", gate: "ready" },
    { id: "p2", state: "ready", gate: "ready" },
    { id: "p3", state: "ready", gate: "ready" },
    { id: "p4", state: "current", gate: "needs_evidence" },
  ]);
  const releaseRequirement = process.stages[4].gate.requirements[0];
  assert.equal(releaseRequirement.satisfied, false);
  assert.ok(releaseRequirement.evidence.length);
  assert.ok(releaseRequirement.sources.length);
  assert.ok(releaseRequirement.nextAction.length);
});

test("keeps later stages upcoming when P0 evidence is missing", () => {
  const process = assessProjectProcess(observation([], { source: 3, tests: 1, commits: 1 }));

  assert.equal(process.currentStageId, "p0");
  assert.equal(process.stages[0].state, "current");
  assert.equal(process.stages[1].state, "upcoming");
  assert.equal(process.stages[0].gate.satisfiedRequirements, 0);
});
