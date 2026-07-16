import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildProjectTimeline,
  evaluateProjectHealth,
  groupTimelineByDay,
  scanProject,
  type ProjectObservation,
  type TimelineEvent,
} from "./scanner.js";

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

test("categorizes more non-conventional subjects while keeping ambiguous ones as change", () => {
  const cases: Array<[string, TimelineEvent["category"]]> = [
    ["Remove unused checkout flag", "implementation"],
    ["Rename product component", "implementation"],
    ["Move utils into shared package", "implementation"],
    ["Clean up dead code", "implementation"],
    ["Simplify pricing logic", "implementation"],
    ["Bump dependencies to latest", "operations"],
    ["Upgrade Next.js to 14", "operations"],
    ["Merge pull request #42 from foo/bar", "operations"],
    // 의미가 모호한 제목은 그대로 change로 남는다.
    ["wip", "change"],
    ["Initial commit", "change"],
  ];

  const observation: ProjectObservation = {
    files: { total: 0, source: 0, tests: 0, config: 0, truncated: false, artifacts: [] },
    git: {
      isRepository: true,
      root: "/project",
      branch: "main",
      head: "abcdef0",
      changedFiles: [],
      recentCommits: cases.map(([subject], index) => ({
        hash: `feed${index}00000000000`,
        shortHash: `feed${index}`,
        authoredAt: `2026-07-15T${String(10 + index).padStart(2, "0")}:00:00.000Z`,
        subject,
        paths: ["src/index.ts"],
      })),
    },
  };

  const byReference = new Map(
    buildProjectTimeline(observation).events.map((event) => [event.title, event.category]),
  );
  for (const [subject, expected] of cases) {
    assert.equal(byReference.get(subject), expected, `${subject} → ${expected}`);
  }
});

test("rolls up timeline events into day buckets, newest day first", () => {
  const event = (id: string, occurredAt: string, category: TimelineEvent["category"]): TimelineEvent => ({
    id,
    type: "commit",
    category,
    occurredAt,
    title: id,
    detail: "",
    source: "git",
    reference: id,
    relatedArtifacts: [],
  });

  const days = groupTimelineByDay([
    event("a", "2026-07-16T09:00:00.000Z", "implementation"),
    event("b", "2026-07-16T15:00:00.000Z", "quality"),
    event("c", "2026-07-16T11:00:00.000Z", "implementation"),
    event("d", "2026-07-14T08:00:00.000Z", "planning"),
  ]);

  assert.equal(days.length, 2);
  // 최신 날짜가 먼저 온다.
  assert.equal(days[0].date, "2026-07-16");
  assert.equal(days[1].date, "2026-07-14");

  // 같은 날 이벤트가 묶이고 최신 이벤트가 먼저 온다.
  assert.equal(days[0].total, 3);
  assert.deepEqual(days[0].events.map((item) => item.id), ["b", "c", "a"]);
  assert.deepEqual(days[0].categoryCounts, { implementation: 2, quality: 1 });

  assert.equal(days[1].total, 1);
  assert.deepEqual(days[1].events.map((item) => item.id), ["d"]);
  assert.deepEqual(days[1].categoryCounts, { planning: 1 });
});

test("returns an empty rollup for no events", () => {
  assert.deepEqual(groupTimelineByDay([]), []);
});
