import assert from "node:assert/strict";
import { Script } from "node:vm";
import test from "node:test";
import { renderDashboard } from "./index.js";

test("renders a syntactically valid snapshot dashboard without unsafe HTML insertion", () => {
  const dashboard = renderDashboard();
  const script = dashboard.match(/<script>([\s\S]*?)<\/script>/)?.[1];

  assert.ok(script, "dashboard script should exist");
  assert.doesNotThrow(() => new Script(script));
  assert.match(dashboard, /\/api\/snapshot/);
  assert.match(dashboard, /\/api\/history/);
  assert.match(dashboard, /\/api\/journey/);
  assert.match(dashboard, /Project Journey/);
  assert.match(dashboard, /현재 Cycle/);
  assert.match(dashboard, /data-view-link="overview"/);
  assert.match(dashboard, /data-view-link="process"/);
  assert.match(dashboard, /data-view-link="artifacts"/);
  assert.match(dashboard, /data-view-link="history"/);
  assert.equal((dashboard.match(/data-view-panel=/g) ?? []).length, 4);
  assert.match(script, /window\.addEventListener\('hashchange'/);
  assert.match(script, /aria-current/);
  assert.match(dashboard, /Project Timeline/);
  assert.match(dashboard, /Cycle 로그/);
  assert.match(script, /renderCycle/);
  assert.match(dashboard, /일자별 작업/);
  assert.match(script, /groupByDay/);
  assert.match(dashboard, /Append-only Activity/);
  // 히스토리 내부 탭 분리와 자동 스캔 토글이 있어야 한다.
  assert.match(dashboard, /data-history-tab="cycle"/);
  assert.match(dashboard, /data-history-tab="daily"/);
  assert.match(dashboard, /data-history-tab="detail"/);
  assert.match(script, /activateHistoryTab/);
  // Signals를 확인 필요/준비됨으로 분리해 가시성을 높인다.
  assert.match(script, /renderSignals/);
  assert.match(dashboard, /id="signals-attend"/);
  assert.match(dashboard, /id="signals-ready"/);
  assert.match(dashboard, /id="auto-scan"/);
  assert.match(script, /setInterval/);
  assert.match(dashboard, /P0–P4 Process/);
  assert.match(dashboard, /Gate 준비도/);
  assert.match(dashboard, /핵심 산출물/);
  assert.match(dashboard, /지원 문서/);
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|document\.write/);
});
