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
        scope: "project",
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
        scope: "project",
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

test("keeps automation docs visible without using them as project gate evidence", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-scope-"));
  await mkdir(path.join(root, "docs", "adr"), { recursive: true });
  await mkdir(path.join(root, "skills", "storefront", "rules"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "# Storefront\n", "utf8");
  await writeFile(path.join(root, "docs", "adr", "0001-routing.md"), "# Routing decision\n", "utf8");
  await writeFile(path.join(root, "skills", "storefront", "rules", "product-pdp.md"), "# Product PDP\n", "utf8");
  await writeFile(path.join(root, "skills", "storefront", "rules", "design-verification.md"), "# Design verification\n", "utf8");

  const snapshot = await scanProject(root, new Date("2026-07-15T10:00:00.000Z"));
  const byPath = new Map(snapshot.observation.files.artifacts.map((artifact) => [artifact.path, artifact]));

  assert.equal(byPath.get("skills/storefront/rules/product-pdp.md")?.scope, "support");
  assert.equal(byPath.get("skills/storefront/rules/product-pdp.md")?.kind, "document");
  assert.equal(byPath.get("skills/storefront/rules/design-verification.md")?.scope, "support");
  assert.equal(byPath.get("docs/adr/0001-routing.md")?.scope, "project");
  assert.equal(byPath.get("docs/adr/0001-routing.md")?.kind, "architecture");

  const planSignal = snapshot.health.signals.find((signal) => signal.id === "project-plan");
  const architectureSignal = snapshot.health.signals.find((signal) => signal.id === "project-architecture");
  assert.equal(planSignal?.level, "warning");
  assert.equal(architectureSignal?.level, "ready");
  assert.deepEqual(architectureSignal?.sources, ["docs/adr/0001-routing.md"]);
  assert.equal(snapshot.health.score, 40);
  assert.equal(snapshot.health.status, "at_risk");
  assert.equal(snapshot.process.currentStageId, "p0");
});

test("categorizes common non-conventional commit subjects", () => {
  const subjects = [
    "Fix checkout retry handling (#10)",
    "Document Stripe sandbox setup",
    "Migrate checkout to the new API",
    "Update CODEOWNERS",
  ];
  const observation: ProjectObservation = {
    files: { total: 0, source: 0, tests: 0, config: 0, truncated: false, artifacts: [] },
    git: {
      isRepository: true,
      root: "/project",
      branch: "main",
      head: "abcdef0",
      changedFiles: [],
      recentCommits: subjects.map((subject, index) => ({
        hash: `abcdef${index}123456789`,
        shortHash: `abcdef${index}`,
        authoredAt: `2026-07-15T1${index}:00:00.000Z`,
        subject,
        paths: ["src/index.ts"],
      })),
    },
  };

  const categories = buildProjectTimeline(observation).events.map((event) => event.category);
  assert.deepEqual(categories, ["operations", "implementation", "documentation", "issue"]);
});
