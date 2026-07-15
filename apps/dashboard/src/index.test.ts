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
  assert.match(dashboard, /Project Timeline/);
  assert.match(dashboard, /Append-only Activity/);
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|document\.write/);
});
