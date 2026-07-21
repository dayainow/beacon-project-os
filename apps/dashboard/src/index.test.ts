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
  assert.match(dashboard, /data-view-link="guide"/);
  assert.match(dashboard, /사용 가이드/);
  assert.equal((dashboard.match(/data-view-panel=/g) ?? []).length, 5);
  assert.match(script, /window\.addEventListener\('hashchange'/);
  assert.match(script, /aria-current/);
  assert.match(dashboard, /작업 하나하나/);
  assert.match(dashboard, /마일스톤 로그/);
  assert.match(script, /renderCycle/);
  assert.match(dashboard, /날짜별로 한 일/);
  assert.match(script, /groupByDay/);
  assert.match(dashboard, /스캔 사이에 바뀐 것/);
  // 히스토리 내부 탭 분리와 자동 스캔 토글이 있어야 한다.
  assert.match(dashboard, /data-history-tab="cycle"/);
  assert.match(dashboard, /data-history-tab="daily"/);
  assert.match(dashboard, /data-history-tab="detail"/);
  assert.match(script, /activateHistoryTab/);
  // Signals를 확인 필요/준비됨으로 분리해 가시성을 높인다.
  assert.match(script, /renderSignals/);
  // Cycle을 마일스톤 단위로 정의하는 안내가 있어야 한다.
  assert.match(dashboard, /마일스톤/);
  assert.match(dashboard, /journey-hint/);
  assert.match(dashboard, /id="signals-attend"/);
  assert.match(dashboard, /id="signals-ready"/);
  assert.match(dashboard, /id="auto-scan"/);
  assert.match(script, /setInterval/);
  assert.match(dashboard, /진행 단계/);
  assert.match(dashboard, /기획부터 배포까지/);
  assert.match(script, /renderProcess/);
  assert.match(dashboard, /id="progress-fill"/);
  assert.match(script, /renderStageDonut/);
  assert.match(dashboard, /id="stage-donut"/);
  assert.match(dashboard, /id="activity-area"/);
  assert.match(script, /renderArtifacts/);
  assert.match(dashboard, /id="artifact-groups"/);
  assert.match(dashboard, /진행 단계/);
  assert.match(dashboard, /건강도/);
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|document\.write/);
});
