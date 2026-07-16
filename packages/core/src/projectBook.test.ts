import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { generateProjectBook } from "./projectBook.js";
import { scanProject } from "./scanner.js";

test("exports identity, gates, artifacts, changes and timeline as Markdown", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-book-"));
  await mkdir(path.join(root, "docs"));
  await writeFile(path.join(root, "README.md"), "# Example\n", "utf8");
  await writeFile(path.join(root, "docs", "PRODUCT.md"), "# Product\n", "utf8");
  const snapshot = await scanProject(root, new Date("2026-07-15T12:00:00.000Z"));
  const book = generateProjectBook({
    identity: {
      name: "example-project",
      root,
      gitBranch: "main",
      gitHead: "abcdef0",
      initializedAt: "2026-07-15T09:00:00.000Z",
    },
    snapshot,
    history: {
      snapshotCount: 2,
      changeCount: 1,
      timelineCount: snapshot.timeline.total,
      latestSnapshotAt: snapshot.scannedAt,
      changes: [{
        id: "change:1",
        kind: "added",
        entity: "artifact",
        detectedAt: snapshot.scannedAt,
        title: "PRODUCT.md 산출물 추가",
        detail: "기획 문서를 발견했습니다.",
        source: "filesystem",
        reference: "docs/PRODUCT.md",
        before: null,
        after: snapshot.observation.files.artifacts.find((artifact) => artifact.path === "docs/PRODUCT.md") ?? null,
      }],
      timeline: snapshot.timeline.events,
    },
  });

  assert.match(book, /^# example-project Project Book/m);
  assert.match(book, /## P0–P4 Gate 준비도/);
  assert.match(book, /## 발견한 산출물/);
  assert.match(book, /핵심 산출물: \*\*2개\*\*/);
  assert.match(book, /지원 문서: \*\*0개\*\*/);
  assert.match(book, /\| 핵심 \| 기획 \| `docs\/PRODUCT\.md`/);
  assert.match(book, /`docs\/PRODUCT\.md`/);
  assert.match(book, /PRODUCT\.md 산출물 추가/);
  assert.match(book, /## Project Timeline/);
  assert.doesNotMatch(book, /## 프로젝트 Cycle/);
  assert.doesNotMatch(book, new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("includes a project cycle section when cycles are provided", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "beacon-book-cycles-"));
  await writeFile(path.join(root, "README.md"), "# Example\n", "utf8");
  const snapshot = await scanProject(root, new Date("2026-07-16T12:00:00.000Z"));

  const book = generateProjectBook({
    identity: {
      name: "example-project",
      root,
      gitBranch: "main",
      gitHead: "abcdef0",
      initializedAt: "2026-07-15T09:00:00.000Z",
    },
    snapshot,
    history: {
      snapshotCount: 3,
      changeCount: 2,
      timelineCount: snapshot.timeline.total,
      latestSnapshotAt: snapshot.scannedAt,
      changes: [],
      timeline: snapshot.timeline.events,
    },
    cycles: [
      {
        id: "cycle-001",
        sequence: 1,
        name: "1차 MVP",
        goal: "첫 흐름을 만든다",
        status: "completed",
        startedAt: "2026-07-15T01:00:00.000Z",
        completedAt: "2026-07-16T09:00:00.000Z",
        baseline: { snapshotId: 1, scannedAt: "2026-07-15T01:00:00.000Z", gitHead: "aaa1111", artifactPaths: ["README.md"] },
        summary: "첫 흐름 완료",
        result: {
          endSnapshotId: 2,
          endScannedAt: "2026-07-16T09:00:00.000Z",
          endGitHead: "bbb2222",
          artifactsAdded: 1,
          artifactsModified: 0,
          artifactsDeleted: 0,
          newCommits: 3,
          healthBefore: { score: 60, status: "attention" },
          healthAfter: { score: 80, status: "attention" },
          gateBefore: "p0",
          gateAfter: "p1",
          readyStagesBefore: 0,
          readyStagesAfter: 2,
        },
      },
      {
        id: "cycle-002",
        sequence: 2,
        name: "2차 검증",
        goal: "테스트를 붙인다",
        status: "active",
        startedAt: "2026-07-16T10:00:00.000Z",
        completedAt: null,
        baseline: { snapshotId: 2, scannedAt: "2026-07-16T10:00:00.000Z", gitHead: "bbb2222", artifactPaths: ["README.md"] },
        summary: null,
        result: null,
      },
    ],
  });

  assert.match(book, /## 프로젝트 Cycle/);
  // 최신 Cycle이 먼저 온다.
  assert.ok(book.indexOf("2차 검증") < book.indexOf("1차 MVP"), "최신 Cycle이 먼저 나타난다");
  assert.match(book, /2차 검증/);
  assert.match(book, /진행 중/);
  assert.match(book, /1차 MVP/);
  assert.match(book, /완료/);
  assert.match(book, /첫 흐름 완료/);
  // 완료 Cycle 요약에 delta가 드러난다.
  assert.match(book, /60.*→.*80/);
  assert.match(book, /P0.*→.*P1/);
  assert.doesNotMatch(book, new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
