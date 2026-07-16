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
  assert.match(dashboard, /Append-only Activity/);
  assert.match(dashboard, /P0–P4 Process/);
  assert.match(dashboard, /Gate 준비도/);
  assert.match(dashboard, /핵심 산출물/);
  assert.match(dashboard, /지원 문서/);
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|document\.write/);
});
