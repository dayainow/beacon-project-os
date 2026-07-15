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
  assert.doesNotMatch(book, new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
