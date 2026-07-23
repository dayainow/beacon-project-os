import assert from "node:assert/strict";
import test from "node:test";
import { assessDocument } from "./documentGuidance.js";

test("finds present sections in a well-formed README", () => {
  const content = [
    "# My Project",
    "이 프로젝트는 무엇을 하는지 설명한다.",
    "## 설치 방법",
    "npm install ...",
    "## 사용법",
    "이렇게 씁니다.",
  ].join("\n");

  const result = assessDocument("overview", content);
  assert.equal(result.kind, "overview");
  assert.ok(result.checks.length > 0);
  const byId = new Map(result.checks.map((check) => [check.id, check]));
  assert.equal(byId.get("purpose")?.present, true);
  assert.equal(byId.get("install")?.present, true);
  assert.equal(byId.get("usage")?.present, true);
  assert.equal(result.missing.length, 0);
});

test("suggests missing sections without asserting the doc is wrong", () => {
  const content = "# Notes\n방법만 적어둔 짧은 메모.";
  const result = assessDocument("overview", content);
  // 빠진 섹션은 missing에 담기고, 각 항목은 다음 행동(제안)을 가진다.
  assert.ok(result.missing.length > 0);
  for (const item of result.missing) {
    assert.ok(item.suggestion.length > 0, "빠진 섹션은 제안 문구를 가져야 한다");
    assert.equal(item.present, false);
  }
  // 판정이 아니라 제안이므로 present/missing 합이 전체 체크와 같다.
  assert.equal(result.checks.length, result.present.length + result.missing.length);
});

test("recognizes Korean and English headings for planning docs", () => {
  const korean = "# 기획\n## 해결할 문제\n...\n## 비목표\n...\n## MVP\n...\n## 목표 사용자\n...";
  const result = assessDocument("planning", korean);
  const byId = new Map(result.checks.map((check) => [check.id, check]));
  assert.equal(byId.get("problem")?.present, true);
  assert.equal(byId.get("non-goals")?.present, true);
  assert.equal(byId.get("mvp")?.present, true);
});

test("matches keywords inside prose, not only exact headings", () => {
  // 헤딩이 아니어도 본문에 키워드가 있으면 present로 본다(유연 매칭).
  const content = "# 설계\n주요 구성요소는 A, B, C다. 데이터 소유권은 코어에 있다. 중요한 결정을 아래 기록한다.";
  const result = assessDocument("architecture", content);
  const byId = new Map(result.checks.map((check) => [check.id, check]));
  assert.equal(byId.get("components")?.present, true);
  assert.equal(byId.get("data-ownership")?.present, true);
});

test("returns an empty assessment for kinds without a checklist", () => {
  const result = assessDocument("document", "아무 내용");
  assert.equal(result.checks.length, 0);
  assert.equal(result.missing.length, 0);
  assert.equal(result.present.length, 0);
});

test("handles empty content by marking all sections missing", () => {
  const result = assessDocument("release", "");
  assert.ok(result.checks.length > 0);
  assert.equal(result.present.length, 0);
  assert.equal(result.missing.length, result.checks.length);
});
