import assert from "node:assert/strict";
import test from "node:test";
import { diffProjectSnapshots } from "./history.js";
import type {
  DiscoveredArtifact,
  GitCommit,
  ProjectSnapshot,
} from "./scanner.js";

function artifact(path: string, modifiedAt: string): DiscoveredArtifact {
  return {
    path,
    name: path.split("/").at(-1) ?? path,
    kind: path.includes("PRODUCT") ? "planning" : path.includes("ARCHITECTURE") ? "architecture" : "overview",
    scope: "project",
    modifiedAt,
    source: "filesystem",
  };
}

function commit(hash: string, subject: string): GitCommit {
  return {
    hash,
    shortHash: hash.slice(0, 7),
    author: "Tester",
    authoredAt: "2026-07-15T10:00:00.000Z",
    subject,
    paths: ["README.md"],
  };
}

function snapshot(
  scannedAt: string,
  artifacts: DiscoveredArtifact[],
  commits: GitCommit[],
): ProjectSnapshot {
  return {
    scannedAt,
    observation: {
      files: { total: artifacts.length, source: 0, tests: 0, config: 0, truncated: false, artifacts },
      git: {
        isRepository: true,
        root: "/project",
        branch: "main",
        head: commits[0]?.shortHash ?? null,
        changedFiles: [],
        recentCommits: commits,
      },
    },
    health: {
      status: "attention",
      score: 60,
      passedChecks: 3,
      totalChecks: 5,
      headline: "test",
      signals: [],
    },
    timeline: { events: [], total: 0, truncated: false },
    process: {
      templateId: "beacon-default-p0-p4-v1",
      currentStageId: "p0",
      readyStages: 0,
      totalStages: 5,
      stages: [],
    },
  };
}

test("produces append-only artifact and commit changes between snapshots", () => {
  const previous = snapshot(
    "2026-07-15T10:00:00.000Z",
    [artifact("README.md", "2026-07-15T09:00:00.000Z"), artifact("docs/PRODUCT.md", "2026-07-15T09:00:00.000Z")],
    [commit("aaaaaaa11111111", "feat: baseline")],
  );
  const current = snapshot(
    "2026-07-15T11:00:00.000Z",
    [artifact("README.md", "2026-07-15T10:30:00.000Z"), artifact("docs/ARCHITECTURE.md", "2026-07-15T10:40:00.000Z")],
    [commit("bbbbbbb22222222", "docs: add architecture"), ...previous.observation.git.recentCommits],
  );

  assert.deepEqual(
    diffProjectSnapshots(previous, current).map(({ kind, entity, reference }) => ({ kind, entity, reference })),
    [
      { kind: "added", entity: "artifact", reference: "docs/ARCHITECTURE.md" },
      { kind: "deleted", entity: "artifact", reference: "docs/PRODUCT.md" },
      { kind: "modified", entity: "artifact", reference: "README.md" },
      { kind: "added", entity: "commit", reference: "bbbbbbb" },
    ],
  );
});

test("treats the first snapshot as a baseline without synthetic changes", () => {
  const baseline = snapshot(
    "2026-07-15T10:00:00.000Z",
    [artifact("README.md", "2026-07-15T09:00:00.000Z")],
    [],
  );

  assert.deepEqual(diffProjectSnapshots(null, baseline), []);
});
