export function renderDashboard(): string {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Beacon</title>
    <style>
      :root {
        color-scheme: light;
        --font-sans: "Pretendard Variable", "Pretendard", -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Segoe UI Variable", "Segoe UI", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;
        font-family: var(--font-sans);
        font-feature-settings: "cv11", "ss01";
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        --bg: #eef0f3;
        --surface: #ffffff;
        --surface-2: #f4f6f8;
        --card-radius: 24px;
        --card-shadow: 0 1px 3px rgb(20 22 28 / 3%), 0 8px 24px rgb(20 22 28 / 4%);
        --line: #ebedf1;
        --line-soft: #f1f3f6;
        --ink: #191c22;
        --ink-soft: #5c6069;
        --ink-faint: #9a9ea8;
        --accent: #5b43ff;
        --accent-soft: #f0edff;
        --accent-ink: #4232c8;
        background: var(--bg); color: var(--ink);
      }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; }
      button { font: inherit; }
      a { color: inherit; }
      .app-shell { width: min(1480px, 100%); min-height: 100vh; margin: 0 auto; display: grid; grid-template-columns: 236px minmax(0, 1fr); gap: 0; }
      .sidebar { position: sticky; top: 0; height: 100vh; padding: 26px 16px 22px; background: transparent; display: flex; flex-direction: column; }
      .sidebar-brand { padding: 4px 12px 22px; }
      .sidebar-brand strong { display: block; margin-top: 6px; font-size: 20px; letter-spacing: -.035em; }
      .sidebar-brand span { display: block; margin-top: 5px; color: var(--ink-faint); font-size: 11px; line-height: 1.45; }
      .navigation { display: grid; gap: 3px; padding: 18px 0; }
      .nav-link { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3px 12px; padding: 11px 13px; border: 1px solid transparent; border-radius: 13px; text-decoration: none; color: var(--ink-soft); }
      .nav-link:hover { background: var(--surface); box-shadow: var(--card-shadow); }
      .nav-link[aria-current="page"] { background: var(--surface); color: var(--accent-ink); box-shadow: var(--card-shadow); }
      .nav-name { font-size: 13.5px; font-weight: 800; }
      .nav-description { grid-column: 1 / -1; color: var(--ink-faint); font-size: 10px; }
      .nav-count { min-width: 22px; padding: 2px 6px; border-radius: 999px; background: var(--surface-2); color: var(--ink-faint); font-size: 10px; font-weight: 800; text-align: center; }
      .nav-link[aria-current="page"] .nav-count { background: var(--accent-soft); color: var(--accent-ink); }
      .sidebar-project { margin-top: auto; padding: 15px 14px; border-radius: 14px; background: var(--surface); box-shadow: var(--card-shadow); }
      .sidebar-project strong { display: block; margin-top: 7px; font-size: 13px; overflow-wrap: anywhere; }
      .sidebar-project span { display: block; margin-top: 5px; color: var(--ink-faint); font-size: 10px; }
      main { width: 100%; margin: 0 auto; padding: 28px 32px 56px; }
      header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
      .brand { color: var(--accent); font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
      h1 { margin: 6px 0 0; font-size: clamp(26px, 4vw, 33px); font-weight: 750; letter-spacing: -.033em; }
      .page-description { margin: 7px 0 0; color: var(--ink-soft); font-size: 13px; }
      .header-actions { display: flex; align-items: center; gap: 8px; }
      .header-actions > * { height: 36px; display: inline-flex; align-items: center; gap: 7px; padding: 0 13px; border-radius: 10px; font-size: 12px; font-weight: 700; border: 1px solid #d8d9dd; box-sizing: border-box; }
      .status { border-color: #ddd8ff; background: #f5f2ff; color: #5b43ff; font-weight: 800; }
      .status::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #5b43ff; flex: none; }
      .status.offline { border-color: #f0d3d6; background: #fdf2f3; color: #bd2736; }
      .status.offline::before { background: #d64550; }
      .refresh { background: #fff; color: #34373d; cursor: pointer; }
      .refresh:hover { border-color: #9d91ff; }
      .refresh:disabled { cursor: wait; opacity: .55; }
      .auto-scan { background: #fff; color: #555962; cursor: pointer; }
      .auto-scan:hover { border-color: #9d91ff; }
      .auto-scan input { accent-color: #5b43ff; cursor: pointer; margin: 0; }
      .history-tabs { display: flex; gap: 6px; margin-bottom: 4px; }
      .history-tab { display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border: 1px solid #dedfe3; border-radius: 999px; background: #fff; color: #555962; font-size: 13px; font-weight: 800; cursor: pointer; }
      .history-tab:hover { border-color: #9d91ff; }
      .history-tab[aria-selected="true"] { border-color: #d9d2ff; background: #f4f1ff; color: #3f2ec4; box-shadow: 0 6px 18px rgb(63 46 196 / 8%); }
      .tab-count { min-width: 20px; padding: 2px 6px; border-radius: 999px; background: #ececf0; color: #6c707a; font-size: 10px; font-weight: 800; text-align: center; }
      .history-tab[aria-selected="true"] .tab-count { background: #ded7ff; color: #4935d0; }
      .history-panel { display: grid; gap: 12px; }
      .history-panel[hidden] { display: none; }
      .panel-hint { margin: 0; padding: 0 24px 4px; color: #8a8d95; font-size: 12px; line-height: 1.5; }
      .card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--card-radius); box-shadow: var(--card-shadow); }
      .identity { padding: 26px; }
      .eyebrow { color: var(--ink-faint); font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      h2 { margin: 8px 0 6px; font-size: 25px; letter-spacing: -.025em; }
      .root { margin: 0; color: #6c707a; font-size: 13px; overflow-wrap: anywhere; }
      .identity-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      .chip { border: 1px solid #e1e2e5; background: #fafafa; border-radius: 999px; padding: 7px 10px; font-size: 12px; color: #555962; }
      .view { display: grid; gap: 12px; }
      .view[hidden] { display: none; }
      .journey { padding: 26px; border-left: 4px solid #5b43ff; }
      .journey-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
      .journey h2 { margin-top: 8px; }
      .journey-goal { margin: 10px 0 0; max-width: 760px; color: #555962; font-size: 14px; line-height: 1.6; }
      .journey-hint { margin: 10px 0 0; max-width: 760px; color: #8a8d95; font-size: 12px; line-height: 1.5; }
      .journey-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      .cycle-number { color: #5b43ff; font: 800 12px ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
      .chart-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .chart-card { padding: 20px 22px; display: flex; flex-direction: column; }
      .chart-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; column-gap: 10px; margin-bottom: 16px; }
      .chart-head .eyebrow { grid-column: 1 / -1; margin-bottom: 5px; }
      .chart-head h3 { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: -.02em; white-space: nowrap; }
      .chart-total { font-size: 12px; font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; white-space: nowrap; }
      .donut-wrap { position: relative; width: 120px; height: 120px; margin: 4px auto 6px; }
      .donut-center { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
      .donut-center strong { display: block; font-size: 24px; font-weight: 850; letter-spacing: -.04em; }
      .donut-center span { font-size: 10px; color: var(--ink-faint); font-weight: 700; }
      .donut-legend { display: grid; gap: 6px; margin-top: auto; padding-top: 12px; }
      .donut-legend .lg { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ink-soft); }
      .donut-legend .lg .sw { width: 9px; height: 9px; border-radius: 3px; flex: none; }
      .donut-legend .lg .n { margin-left: auto; font-weight: 800; color: var(--ink); font-variant-numeric: tabular-nums; }
      .hbars { display: grid; gap: 11px; margin-top: 2px; }
      .hbar-row { display: grid; gap: 5px; }
      .hbar-top { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
      .hbar-top .st { font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .hbar-top .stx { margin-left: auto; padding-left: 8px; font-size: 11px; font-weight: 800; white-space: nowrap; }
      .hbar-track { height: 7px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
      .hbar-fill { height: 100%; border-radius: 999px; }
      .area-axis { display: flex; justify-content: space-between; margin-top: 6px; color: var(--ink-faint); font-size: 10px; font-variant-numeric: tabular-nums; }
      #activity-area { display: block; margin-top: 4px; }
      .metric { padding: 20px; min-height: 118px; }
      .metric-value { display: block; margin-top: 12px; font-size: 28px; font-weight: 850; letter-spacing: -.04em; }
      .metric-note { display: block; margin-top: 4px; color: #777b85; font-size: 12px; }
      .health-card { border-left: 4px solid #5b43ff; }
      .health-card.attention { border-left-color: #f0a100; }
      .health-card.at_risk { border-left-color: #df4b57; }
      .process { overflow: hidden; }
      .progress-wrap { display: flex; align-items: center; gap: 14px; padding: 18px 24px 4px; }
      .progress-track { flex: 1; height: 8px; border-radius: 999px; background: #eceef2; overflow: hidden; }
      .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #7c6cff, #5b43ff); transition: width .5s ease; width: 0; }
      .progress-text { font-size: 12px; font-weight: 800; color: #5b43ff; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .stage-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; padding: 18px 24px; }
      .stage { position: relative; min-height: 132px; border: 1px solid #e2e3e6; border-radius: 13px; padding: 15px; background: #fafafa; display: flex; flex-direction: column; }
      .stage.ready { border-color: #bdebd7; background: #effbf5; }
      .stage.current { border-color: #8f7fff; background: #f6f3ff; box-shadow: 0 0 0 1px #8f7fff, 0 8px 22px rgb(91 67 255 / 12%); }
      .stage-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .stage-code { color: #9296a0; font: 700 10px ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; letter-spacing: .04em; }
      .stage-icon { width: 18px; height: 18px; border-radius: 50%; flex: none; display: grid; place-items: center; font-size: 11px; font-weight: 800; border: 1.5px solid #cfd2d8; color: #b0b4bc; }
      .stage.ready .stage-icon { background: #13a76f; border-color: #13a76f; color: #fff; }
      .stage.current .stage-icon { background: #5b43ff; border-color: #5b43ff; color: #fff; }
      .stage-name { display: block; margin-top: 10px; font-size: 15px; font-weight: 800; }
      .stage-hint { display: block; margin-top: 5px; color: #8a8d95; font-size: 11px; line-height: 1.45; }
      .stage-state { display: block; margin-top: auto; padding-top: 12px; color: #9296a0; font-size: 11px; font-weight: 700; }
      .stage.ready .stage-state { color: #08764d; }
      .stage.current .stage-state { color: #5b43ff; font-weight: 800; }
      .gate-focus { border-top: 1px solid #ececef; padding: 20px 24px 24px; background: #fcfcfd; }
      .gate-focus h3 { margin: 6px 0 4px; font-size: 18px; letter-spacing: -.02em; }
      .gate-eyebrow-current { color: #5b43ff; }
      .gate-objective { margin: 0; color: #777b85; font-size: 13px; line-height: 1.5; }
      .gate-foot { margin: 16px 0 0; color: #a0a3ab; font-size: 11px; line-height: 1.5; }
      .requirements { display: grid; gap: 8px; margin-top: 16px; }
      .requirement { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 11px; align-items: start; padding: 13px 14px; border: 1px solid #e4e5e8; background: #fff; border-radius: 11px; }
      .requirement.satisfied { border-color: #cdeeda; background: #fbfefc; }
      .requirement-dot { width: 20px; height: 20px; margin-top: 1px; border-radius: 50%; flex: none; display: grid; place-items: center; font-size: 11px; font-weight: 800; background: #fdecec; color: #d64550; }
      .requirement.satisfied .requirement-dot { background: #e7f6ef; color: #0f9d6a; }
      .requirement-title { margin: 0; font-size: 13.5px; font-weight: 800; }
      .requirement-evidence { margin: 4px 0 0; color: #777b85; font-size: 11.5px; line-height: 1.45; }
      .requirement-action { color: #5b43ff; font-size: 11.5px; line-height: 1.5; text-align: right; max-width: 290px; }
      .requirement.satisfied .requirement-action { color: #0f9d6a; font-weight: 700; }
      .layout { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr); gap: 12px; }
      .panel { overflow: hidden; }
      .panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 22px 24px 18px; border-bottom: 1px solid #ececef; }
      .panel-head h2 { margin: 6px 0 0; font-size: 20px; }
      .count { color: #5b43ff; font-size: 12px; font-weight: 800; white-space: nowrap; }
      .list { list-style: none; margin: 0; padding: 0; }
      .list-item { padding: 18px 24px; border-bottom: 1px solid #eeeef1; }
      .list-item:last-child { border-bottom: 0; }
      .signal-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .signal-title, .artifact-name, .timeline-title { margin: 0; font-weight: 800; line-height: 1.4; }
      .badge { border-radius: 999px; padding: 5px 8px; font-size: 10px; font-weight: 850; white-space: nowrap; }
      .badge.warning { background: #fff0f1; color: #bd2736; }
      .badge.attention { background: #fff7df; color: #9a6200; }
      .badge.ready { background: #eaf9f2; color: #08764d; }
      .badge.added { background: #eaf9f2; color: #08764d; }
      .badge.modified { background: #fff7df; color: #9a6200; }
      .badge.deleted { background: #fff0f1; color: #bd2736; }
      .signal-detail { margin: 7px 0 0; color: #666a73; font-size: 13px; line-height: 1.55; }
      .next-action { display: flex; flex-direction: column; gap: 5px; margin: 12px 0 0; padding: 11px 13px; border-radius: 10px; background: #f5f3ff; color: #453a78; font-size: 13px; line-height: 1.55; }
      .next-action-label { align-self: flex-start; font-size: 10px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: #6b5bd6; background: #e7e2ff; padding: 3px 8px; border-radius: 6px; }
      .signal-clear { display: flex; align-items: center; gap: 10px; margin: 4px 24px 16px; padding: 16px 18px; border-radius: 12px; background: #eefaf3; border: 1px solid #cdeeda; color: #0a6b47; font-size: 14px; font-weight: 700; }
      .signal-summary { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 24px; border-bottom: 1px solid #ececef; }
      .summary-pill { display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; }
      .summary-pill .dot { width: 8px; height: 8px; border-radius: 50%; }
      .summary-pill.warning { background: #fff0f1; color: #bd2736; } .summary-pill.warning .dot { background: #df4b57; }
      .summary-pill.attention { background: #fff7df; color: #9a6200; } .summary-pill.attention .dot { background: #f0a100; }
      .summary-pill.ready { background: #eaf9f2; color: #08764d; } .summary-pill.ready .dot { background: #13a76f; }
      .group-label { padding: 16px 24px 4px; color: #8a8d95; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
      .list-item.attend { border-left: 3px solid #f0a100; background: linear-gradient(90deg, #fffdf6 0%, transparent 40%); }
      .list-item.attend.is-warning { border-left-color: #df4b57; background: linear-gradient(90deg, #fff8f8 0%, transparent 40%); }
      .signal-ready { display: flex; align-items: center; gap: 11px; padding: 13px 24px; border-bottom: 1px solid #f2f2f5; }
      .signal-ready:last-child { border-bottom: 0; }
      .signal-ready .dot { width: 9px; height: 9px; border-radius: 50%; background: #13a76f; flex: none; }
      .signal-ready-title { margin: 0; font-size: 13px; font-weight: 700; color: #34373d; }
      .signal-ready-source { margin-left: auto; color: #9699a1; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; text-align: right; }
      .source { margin-top: 9px; color: #9699a1; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
      .artifact-row, .timeline-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .artifact-kind { color: #5b43ff; font-size: 10px; font-weight: 800; text-transform: uppercase; }
      .artifact-path { margin-top: 5px; color: #858892; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
      .agroup { border-top: 1px solid #ececef; }
      .agroup:first-child { border-top: 0; }
      .agroup-head { display: flex; align-items: center; gap: 10px; padding: 14px 24px 8px; }
      .agroup-name { font-size: 14px; font-weight: 800; letter-spacing: -.01em; }
      .agroup-stage { font-size: 10px; font-weight: 800; color: #5b43ff; background: #f0edff; padding: 3px 8px; border-radius: 6px; letter-spacing: .03em; }
      .agroup-count { margin-left: auto; font-size: 11px; font-weight: 800; color: #9296a0; font-variant-numeric: tabular-nums; }
      .agroup-empty { padding: 4px 24px 14px; color: #b0b4bc; font-size: 12.5px; }
      .afile { display: flex; align-items: baseline; gap: 12px; padding: 9px 24px; border-top: 1px solid #f4f4f7; }
      .afile-name { font-size: 13.5px; font-weight: 700; flex: none; }
      .afile-path { color: #9296a0; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; margin-left: auto; text-align: right; }
      .support-wrap { border-top: 1px solid #ececef; margin-top: 4px; }
      .support-wrap > summary { list-style: none; cursor: pointer; padding: 14px 24px; color: #777b85; font-size: 12.5px; font-weight: 700; user-select: none; }
      .support-wrap > summary::-webkit-details-marker { display: none; }
      .support-wrap > summary::before { content: '▸ '; color: #b0b4bc; }
      .support-wrap[open] > summary::before { content: '▾ '; }
      .timeline-side { display: grid; justify-items: end; gap: 7px; }
      .timeline-category { border-radius: 999px; padding: 5px 8px; background: #f2efff; color: #5b43ff; font-size: 10px; font-weight: 850; white-space: nowrap; }
      .timeline-meta { color: #8a8d95; font-size: 11px; white-space: nowrap; }
      .badge.completed { background: #eaf9f2; color: #08764d; }
      .badge.active { background: #f2efff; color: #5b43ff; }
      .cycle-goal-line { margin: 7px 0 0; color: #666a73; font-size: 13px; line-height: 1.55; }
      .cycle-deltas { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
      .cycle-delta { border: 1px solid #e1e2e5; background: #fafafa; border-radius: 999px; padding: 5px 9px; font-size: 11px; color: #555962; }
      .cycle-summary-note { margin: 10px 0 0; padding: 10px 12px; border-radius: 9px; background: #f7f5ff; color: #514875; font-size: 12px; line-height: 1.5; }
      .day-top { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
      .day-date { margin: 0; font-size: 15px; font-weight: 850; letter-spacing: -.02em; }
      .day-total { color: #5b43ff; font-size: 12px; font-weight: 800; white-space: nowrap; }
      .day-categories { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 11px; }
      .day-events { margin-top: 14px; }
      .day-events > summary { list-style: none; cursor: pointer; color: #5b43ff; font-size: 12px; font-weight: 800; user-select: none; }
      .day-events > summary::-webkit-details-marker { display: none; }
      .day-events > summary::before { content: '▸ '; }
      .day-events[open] > summary::before { content: '▾ '; }
      .day-event { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 11px 0; border-top: 1px solid #eeeef1; }
      .day-event:first-of-type { margin-top: 10px; }
      .day-event-title { margin: 0; font-size: 13px; font-weight: 700; line-height: 1.4; }
      .day-event-source { margin-top: 4px; color: #9699a1; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
      .day-event-side { display: grid; justify-items: end; gap: 6px; white-space: nowrap; }
      .day-event-time { color: #8a8d95; font-size: 11px; }
      .day-category { border-radius: 999px; padding: 4px 9px; background: #f2efff; color: #5b43ff; font-size: 11px; font-weight: 800; white-space: nowrap; }
      .empty { padding: 28px 24px; color: #777b85; font-size: 13px; }
      .error { margin-bottom: 12px; padding: 20px; background: #fff0f1; color: #9d1f2c; border: 1px solid #f3c9ce; border-radius: 14px; }
      .nav-guide { margin-top: 6px; }
      .nav-guide .nav-count { background: #ede9ff; color: #5b43ff; }
      .guide-card { padding: 30px 32px 32px; }
      .guide-intro h2 { margin: 8px 0 10px; font-size: 22px; letter-spacing: -.02em; line-height: 1.3; }
      .guide-intro p { margin: 0; color: #555962; font-size: 14px; line-height: 1.65; max-width: 64ch; }
      .guide-intro strong { color: #34373d; }
      .guide-steps { list-style: none; margin: 28px 0 0; padding: 0; display: grid; gap: 10px; counter-reset: g; }
      .gstep { display: flex; gap: 15px; padding: 17px 18px; border: 1px solid #e4e5e8; border-radius: 13px; background: #fcfcfd; }
      .gstep-n { flex: none; width: 28px; height: 28px; border-radius: 8px; background: #5b43ff; color: #fff; display: grid; place-items: center; font-size: 13px; font-weight: 800; }
      .gstep h3 { margin: 3px 0 5px; font-size: 15px; font-weight: 800; letter-spacing: -.01em; }
      .gstep h3 code { font-size: .82em; background: #f0edff; color: #4935d0; padding: 2px 7px; border-radius: 6px; font-weight: 700; margin-left: 4px; }
      .gstep p { margin: 0; color: #666a73; font-size: 13px; line-height: 1.6; }
      .gstep p code { font-size: .85em; background: #f2f2f5; padding: 1px 5px; border-radius: 5px; overflow-wrap: anywhere; }
      .guide-notes { display: grid; gap: 8px; margin-top: 22px; padding-top: 22px; border-top: 1px solid #ececef; }
      .gnote { padding: 13px 15px; border-radius: 11px; background: #f7f5ff; color: #514875; font-size: 12.5px; line-height: 1.6; }
      .gnote strong { color: #3f2ec4; }
      .gnote code { font-size: .85em; background: #ece8ff; padding: 1px 5px; border-radius: 5px; }
      @media (max-width: 960px) { .app-shell { display: block; } .sidebar { position: sticky; z-index: 10; width: 100%; height: auto; padding: 14px 20px; border-right: 0; border-bottom: 1px solid #dedfe3; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 20px; } .sidebar-brand { padding: 0; border: 0; } .sidebar-brand strong { margin: 0; font-size: 18px; } .sidebar-brand .brand, .sidebar-brand span, .sidebar-project, .nav-description { display: none; } .navigation { display: flex; justify-content: flex-end; gap: 5px; padding: 0; overflow-x: auto; } .nav-link { display: flex; align-items: center; gap: 7px; padding: 9px 11px; white-space: nowrap; } .metrics { grid-template-columns: repeat(2, 1fr); } .stage-grid { grid-template-columns: repeat(2, 1fr); } .layout { grid-template-columns: 1fr; } .chart-grid { grid-template-columns: 1fr 1fr; } .chart-wide { grid-column: 1 / -1; } }
      @media (max-width: 560px) { .sidebar { display: block; padding: 12px; } .sidebar-brand { display: none; } .navigation { justify-content: flex-start; } .nav-count { display: none; } main { width: min(100% - 24px, 1160px); padding-top: 28px; } header { align-items: flex-start; flex-direction: column; } .metrics, .stage-grid { grid-template-columns: 1fr; } .metric { min-height: auto; } .journey-top { display: block; } .cycle-number { display: block; margin-top: 12px; } .requirement { grid-template-columns: auto minmax(0, 1fr); } .requirement-action { grid-column: 2; text-align: left; max-width: none; } }
    </style>
  </head>
  <body>
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand">Beacon</div>
          <strong>Project OS</strong>
          <span>프로젝트의 방향과 여정을 탐색합니다.</span>
        </div>
        <nav class="navigation" aria-label="프로젝트 화면">
          <a class="nav-link" href="#overview" data-view-link="overview" aria-current="page">
            <span class="nav-name">개요</span><span class="nav-count" id="nav-overview-count">—</span>
            <span class="nav-description">현재 Cycle과 점검 결과</span>
          </a>
          <a class="nav-link" href="#process" data-view-link="process">
            <span class="nav-name">단계</span><span class="nav-count" id="nav-process-count">—</span>
            <span class="nav-description">P0–P4와 Gate 준비도</span>
          </a>
          <a class="nav-link" href="#artifacts" data-view-link="artifacts">
            <span class="nav-name">산출물</span><span class="nav-count" id="nav-artifact-count">—</span>
            <span class="nav-description">발견한 프로젝트 결과물</span>
          </a>
          <a class="nav-link" href="#history" data-view-link="history">
            <span class="nav-name">히스토리</span><span class="nav-count" id="nav-history-count">—</span>
            <span class="nav-description">타임라인과 변화 기록</span>
          </a>
          <a class="nav-link nav-guide" href="#guide" data-view-link="guide">
            <span class="nav-name">가이드</span><span class="nav-count">?</span>
            <span class="nav-description">처음이라면 여기부터</span>
          </a>
        </nav>
        <div class="sidebar-project">
          <div class="eyebrow">Current Project</div>
          <strong id="sidebar-project-name">불러오는 중…</strong>
          <span id="sidebar-cycle">Cycle 확인 중</span>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <div class="brand">Project Workspace</div>
            <h1 id="page-title">프로젝트 개요</h1>
            <p class="page-description" id="page-description">현재 Cycle과 프로젝트 점검 결과를 확인합니다.</p>
          </div>
          <div class="header-actions">
            <div class="status" id="status">프로젝트 확인 중</div>
            <label class="auto-scan" for="auto-scan"><input type="checkbox" id="auto-scan" />자동 스캔</label>
            <button class="refresh" id="refresh" type="button">다시 스캔</button>
          </div>
        </header>

        <div id="error" class="error" hidden></div>

        <div class="view" id="view-overview" data-view-panel="overview">
          <section class="chart-grid" aria-label="프로젝트 요약 차트">
            <article class="card chart-card">
              <div class="chart-head"><div class="eyebrow">진행 단계</div><h3>P0–P4 준비도</h3></div>
              <div class="donut-wrap"><svg id="stage-donut" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="단계 준비도 도넛"></svg><div class="donut-center"><strong id="donut-value">—</strong><span>완료</span></div></div>
              <div class="donut-legend" id="stage-legend"></div>
            </article>
            <article class="card chart-card">
              <div class="chart-head"><div class="eyebrow">건강도</div><h3>Health 5개 기준</h3></div>
              <div class="hbars" id="health-bars"></div>
            </article>
            <article class="card chart-card chart-wide">
              <div class="chart-head"><div class="eyebrow">활동량</div><h3>최근 작업 흐름</h3><span class="chart-total" id="activity-total">—</span></div>
              <svg id="activity-area" viewBox="0 0 320 96" preserveAspectRatio="none" width="100%" height="96" role="img" aria-label="일자별 활동량 영역 그래프"></svg>
              <div class="area-axis" id="activity-axis"></div>
            </article>
          </section>

          <section class="card identity" aria-live="polite">
            <div class="eyebrow">Project Identity</div>
            <h2 id="name">불러오는 중…</h2>
            <p class="root" id="root"></p>
            <div class="identity-meta">
              <span class="chip" id="branch">Git 확인 중</span>
              <span class="chip" id="head">HEAD —</span>
              <span class="chip" id="scanned">스캔 대기</span>
              <span class="chip" id="history-count">기록 확인 중</span>
            </div>
          </section>

          <section class="card journey" aria-live="polite">
            <div class="journey-top">
              <div>
                <div class="eyebrow">Project Journey · 현재 Cycle</div>
                <h2 id="cycle-name">Cycle을 확인하고 있습니다.</h2>
                <p class="journey-goal" id="cycle-goal">프로젝트 목표와 시작 기준선을 불러오는 중입니다.</p>
                <p class="journey-hint">Cycle은 완결되는 목표 하나(마일스톤)입니다. 시작 시점을 기준선으로 잡고, 종료하면 그 사이 성과를 요약합니다.</p>
              </div>
              <span class="cycle-number" id="cycle-number">—</span>
            </div>
            <div class="journey-meta">
              <span class="chip" id="cycle-started">시작 시점 · —</span>
              <span class="chip" id="cycle-baseline">기준선 · —</span>
              <span class="chip" id="cycle-artifacts">시작 산출물 · —</span>
            </div>
          </section>


          <section class="card panel">
            <div class="panel-head"><div><div class="eyebrow">Checklist</div><h2>프로젝트 점검</h2></div><span class="count" id="signal-count">확인 중</span></div>
            <div class="signal-summary" id="signal-summary"></div>
            <div class="group-label" id="attend-label" hidden>먼저 챙길 것</div>
            <ul class="list" id="signals-attend"></ul>
            <div class="group-label" id="ready-label" hidden>잘 갖춰진 것</div>
            <div id="signals-ready"></div>
          </section>
        </div>

        <div class="view" id="view-process" data-view-panel="process" hidden>
          <section class="card process">
            <div class="panel-head"><div><div class="eyebrow">진행 단계</div><h2>기획부터 배포까지, 지금 어디까지</h2></div><span class="count" id="process-count">확인 중</span></div>
            <div class="progress-wrap"><div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div><span class="progress-text" id="progress-text">—</span></div>
            <div class="stage-grid" id="stages"></div>
            <div class="gate-focus">
              <div class="eyebrow" id="gate-eyebrow">지금 확인할 단계</div>
              <h3 id="gate-title">단계를 확인하고 있어요.</h3>
              <p class="gate-objective" id="gate-objective"></p>
              <div class="requirements" id="requirements"></div>
              <p class="gate-foot">자동 관찰 결과일 뿐, 사람의 최종 판단(GO·HOLD·KILL)을 대신하지 않습니다.</p>
            </div>
          </section>
        </div>

        <div class="view" id="view-artifacts" data-view-panel="artifacts" hidden>
          <section class="card panel">
            <div class="panel-head"><div><div class="eyebrow">문서</div><h2>프로젝트 문서 모아보기</h2></div><span class="count" id="artifact-label">확인 중</span></div>
            <p class="panel-hint">종류별로 묶어 보여줍니다. 각 종류가 어느 단계(P0~P4)의 근거인지 함께 표시됩니다.</p>
            <div id="artifact-groups"></div>
            <div id="artifact-support"></div>
          </section>
        </div>

        <div class="view" id="view-history" data-view-panel="history" hidden>
          <div class="history-tabs" role="tablist" aria-label="히스토리 보기">
            <button class="history-tab" type="button" data-history-tab="daily" aria-selected="true">일자별<span class="tab-count" id="tab-daily-count">—</span></button>
            <button class="history-tab" type="button" data-history-tab="cycle" aria-selected="false">Cycle<span class="tab-count" id="tab-cycle-count">—</span></button>
            <button class="history-tab" type="button" data-history-tab="detail" aria-selected="false">상세<span class="tab-count" id="tab-detail-count">—</span></button>
          </div>

          <div class="history-panel" data-history-panel="daily">
            <section class="card panel daily">
              <div class="panel-head"><div><div class="eyebrow">일자별</div><h2>날짜별로 한 일</h2></div><span class="count" id="daily-label">—</span></div>
              <p class="panel-hint">하루 단위로 무엇을 몇 건 했는지 묶어 보여줍니다. 날짜를 펼치면 그날의 개별 작업이 나옵니다.</p>
              <ul class="list" id="daily"><li class="empty">아직 기록된 작업이 없어요. commit하거나 문서를 저장하면 여기에 쌓입니다.</li></ul>
            </section>
          </div>

          <div class="history-panel" data-history-panel="cycle" hidden>
            <section class="card panel cycles">
              <div class="panel-head"><div><div class="eyebrow">Cycle</div><h2>마일스톤 로그</h2></div><span class="count" id="cycle-log-label">—</span></div>
              <p class="panel-hint">완결되는 목표(마일스톤) 단위로 끊어, 각 Cycle에서 무엇을 이뤘는지 보여줍니다.</p>
              <ul class="list" id="cycle-log"><li class="empty">아직 시작한 마일스톤이 없어요. beacon cycle start로 첫 목표를 시작해 보세요.</li></ul>
            </section>
          </div>

          <div class="history-panel" data-history-panel="detail" hidden>
            <section class="card panel timeline">
              <div class="panel-head"><div><div class="eyebrow">타임라인</div><h2>작업 하나하나</h2></div><span class="count" id="timeline-label">—</span></div>
              <p class="panel-hint">commit과 문서 변경을 하나씩 시간순으로 나열합니다.</p>
              <ul class="list" id="timeline"><li class="empty">아직 표시할 commit이나 문서 변경이 없어요.</li></ul>
            </section>

            <section class="card panel changes">
              <div class="panel-head"><div><div class="eyebrow">변화</div><h2>스캔 사이에 바뀐 것</h2></div><span class="count" id="change-label">—</span></div>
              <p class="panel-hint">직전에 봤을 때와 비교해 새로 생기거나 바뀐 항목을 보여줍니다.</p>
              <ul class="list" id="changes"><li class="empty">첫 스캔은 기준선으로 저장돼요. 다음 스캔부터 추가·변경·삭제가 여기 쌓입니다.</li></ul>
            </section>
          </div>
        </div>

        <div class="view" id="view-guide" data-view-panel="guide" hidden>
          <section class="card guide-card">
            <div class="guide-intro">
              <div class="eyebrow">시작하기</div>
              <h2>Beacon은 프로젝트 폴더에 붙는 "상태 표시등"입니다</h2>
              <p>파일과 Git을 <strong>읽기만 해서</strong> 지금까지 뭐가 됐고 뭐가 빠졌는지 보여줍니다. 손으로 정할 건 딱 하나 — <strong>이번에 완성할 목표(마일스톤)</strong> 뿐이고, 나머지는 자동으로 채워집니다.</p>
            </div>
            <ol class="guide-steps">
              <li class="gstep"><span class="gstep-n">1</span><div><h3>붙이기 <code>beacon init</code></h3><p>확인할 프로젝트 폴더에서 실행하면 <code>.beacon/</code> 인덱스가 생깁니다. 원본 파일은 건드리지 않아요.</p></div></li>
              <li class="gstep"><span class="gstep-n">2</span><div><h3>열어보기 <code>beacon open</code></h3><p>이 대시보드가 열립니다. 개요·단계·산출물·히스토리 네 화면으로 현재 상태를 봅니다.</p></div></li>
              <li class="gstep"><span class="gstep-n">3</span><div><h3>마일스톤 시작 <code>beacon cycle start</code></h3><p>이름과 목표를 정합니다. 예: <code>beacon cycle start "대출 기능 MVP" --goal "대출·반납 첫 흐름을 완성한다"</code>. 이 순간이 출발점으로 기록됩니다.</p></div></li>
              <li class="gstep"><span class="gstep-n">4</span><div><h3>평소처럼 작업</h3><p>Beacon엔 아무것도 입력하지 않습니다. 코드 짜고 commit하면, <strong>자동 스캔</strong>을 켠 채로 히스토리에 저절로 쌓입니다.</p></div></li>
              <li class="gstep"><span class="gstep-n">5</span><div><h3>마일스톤 종료 <code>beacon cycle complete</code></h3><p>목표가 됐으면 닫습니다. 출발점 대비 성과(산출물·commit·Health·단계 이동)가 자동 요약돼 히스토리 Cycle 탭에 남습니다.</p></div></li>
            </ol>
            <div class="guide-notes">
              <div class="gnote"><strong>Health란?</strong> 소개·기획·설계 문서 3개 + Git·이력 2개, 총 5개 중 몇 개가 준비됐나의 비율입니다. 하나라도 빠지면 정직하게 노란색으로 표시돼요.</div>
              <div class="gnote"><strong>단계(P0~P4)란?</strong> 기획→디자인→개발→검증→배포 중 지금 어디까지 근거가 갖춰졌는지 보여줍니다. 산출물 화면의 종류 배지와 이어집니다.</div>
              <div class="gnote"><strong>내 것은 내 것.</strong> 파일은 외부로 전송되지 않고, 모든 데이터는 내 컴퓨터의 <code>.beacon/</code> 폴더에만 저장됩니다.</div>
            </div>
          </section>
        </div>
      </main>
    </div>
    <script>
      const element = (id) => document.getElementById(id);
      const kindLabels = { overview: '개요', planning: '기획', architecture: '설계', quality: '검증', release: '릴리스', document: '문서' };
      const levelLabels = { warning: '보완 권장', attention: '확인 권장', ready: '완료' };
      const categoryLabels = { planning: '기획', design: '설계', implementation: '기능', issue: '문제 해결', quality: '검증', delivery: '릴리스', operations: '운영', documentation: '문서', change: '변경' };
      const changeLabels = { added: '추가', modified: '변경', deleted: '삭제' };
      const stageStateLabels = { ready: '준비됨', current: '지금 여기', upcoming: '아직' };
      const stageHints = {
        p0: '루트 README와 기획 문서',
        p1: '설계·구조 문서 (ADR 등)',
        p2: '구현 소스와 commit 이력',
        p3: '테스트 또는 검증 문서',
        p4: 'CHANGELOG·릴리스 문서',
      };
      const views = {
        overview: { title: '프로젝트 개요', description: '현재 Cycle과 프로젝트 점검 결과를 확인합니다.' },
        process: { title: '단계와 Gate', description: 'P0–P4 단계별 준비 근거와 다음 행동을 확인합니다.' },
        artifacts: { title: '프로젝트 산출물', description: '파일에서 자동으로 발견한 핵심 결과물을 확인합니다.' },
        history: { title: '프로젝트 히스토리', description: '작업의 의미 흐름과 스캔 사이의 변화를 확인합니다.' },
        guide: { title: '사용 가이드', description: 'Beacon을 처음부터 어떻게 쓰는지 단계별로 안내합니다.' },
      };

      function text(tag, className, value) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        node.textContent = value;
        return node;
      }

      const SVGNS = 'http://www.w3.org/2000/svg';
      function svg(tag, attrs) {
        const node = document.createElementNS(SVGNS, tag);
        for (const key in attrs) node.setAttribute(key, attrs[key]);
        return node;
      }

      // 검증된 팔레트 (dataviz validate_palette.js 통과)
      const chartColors = { done: '#13a76f', current: '#5b43ff', wait: '#d3d6dd', ok: '#13a76f', warn: '#f0a100', risk: '#df4b57' };

      function renderStageDonut(process) {
        const box = element('stage-donut');
        box.replaceChildren();
        const total = process.totalStages;
        const done = process.readyStages;
        const current = process.currentStageId ? 1 : 0;
        const wait = total - done - current;
        const segs = [
          { label: '완료', value: done, color: chartColors.done },
          { label: '진행 중', value: current, color: chartColors.current },
          { label: '대기', value: wait, color: chartColors.wait },
        ];
        const r = 46, cx = 60, cy = 60, circ = 2 * Math.PI * r, gap = 3;
        box.append(svg('circle', { cx, cy, r, fill: 'none', stroke: 'var(--surface-2)', 'stroke-width': 13 }));
        let offset = 0;
        segs.forEach((s) => {
          if (s.value <= 0) return;
          const len = (s.value / total) * circ;
          const arc = svg('circle', {
            cx, cy, r, fill: 'none', stroke: s.color, 'stroke-width': 13,
            'stroke-dasharray': Math.max(0, len - gap) + ' ' + (circ - Math.max(0, len - gap)),
            'stroke-dashoffset': -offset, transform: 'rotate(-90 ' + cx + ' ' + cy + ')', 'stroke-linecap': 'round',
          });
          box.append(arc);
          offset += len;
        });
        element('donut-value').textContent = done + '/' + total;
        const legend = element('stage-legend');
        legend.replaceChildren();
        segs.forEach((s) => {
          const row = text('div', 'lg', '');
          const sw = text('span', 'sw', ''); sw.style.background = s.color;
          row.append(sw, text('span', '', s.label), text('span', 'n', String(s.value)));
          legend.append(row);
        });
      }

      const healthLabels = {
        'project-overview': '소개 문서', 'project-plan': '기획 문서', 'project-architecture': '설계 문서',
        'git-repository': 'Git 저장소', 'git-history': '변경 이력',
      };

      function renderHealthBars(health) {
        const box = element('health-bars');
        box.replaceChildren();
        const levelColor = { ready: chartColors.ok, attention: chartColors.warn, warning: chartColors.risk };
        const levelText = { ready: '준비됨', attention: '확인', warning: '보완' };
        health.signals.slice(0, 5).forEach((sig) => {
          const color = levelColor[sig.level] || chartColors.wait;
          const row = text('div', 'hbar-row', '');
          const top = text('div', 'hbar-top', '');
          const dot = text('span', 'sw', ''); dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + color;
          const stx = text('span', 'stx', levelText[sig.level] || '—'); stx.style.color = color;
          top.append(dot, text('span', 'st', healthLabels[sig.id] || sig.title), stx);
          const track = text('div', 'hbar-track', '');
          const fill = text('div', 'hbar-fill', '');
          fill.style.cssText = 'width:' + (sig.level === 'ready' ? 100 : sig.level === 'attention' ? 55 : 20) + '%;background:' + color;
          track.append(fill);
          row.append(top, track);
          box.append(row);
        });
      }

      function renderActivityArea(timeline) {
        const box = element('activity-area');
        box.replaceChildren();
        const days = groupByDay(timeline).slice(0, 14).reverse();
        element('activity-total').textContent = timeline.length + '건';
        const axis = element('activity-axis');
        axis.replaceChildren();
        if (days.length === 0) {
          box.append(svg('line', { x1: 0, y1: 90, x2: 320, y2: 90, stroke: 'var(--line)', 'stroke-width': 1 }));
          return;
        }
        const W = 320, H = 96, pad = 6;
        const max = Math.max(1, ...days.map((d) => d.total));
        const step = days.length > 1 ? (W) / (days.length - 1) : 0;
        const pts = days.map((d, i) => [days.length > 1 ? i * step : W / 2, H - pad - (d.total / max) * (H - pad * 2)]);
        const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
        const area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + H + ' L' + pts[0][0].toFixed(1) + ' ' + H + ' Z';
        const grad = svg('linearGradient', { id: 'areaGrad', x1: '0', y1: '0', x2: '0', y2: '1' });
        grad.append(svg('stop', { offset: '0', 'stop-color': chartColors.current, 'stop-opacity': '0.22' }));
        grad.append(svg('stop', { offset: '1', 'stop-color': chartColors.current, 'stop-opacity': '0' }));
        const defs = svg('defs', {}); defs.append(grad); box.append(defs);
        box.append(svg('path', { d: area, fill: 'url(#areaGrad)' }));
        box.append(svg('path', { d: line, fill: 'none', stroke: chartColors.current, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
        pts.forEach((p) => box.append(svg('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 2.5, fill: chartColors.current })));
        const fmt = (d) => new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(new Date(d + 'T00:00:00Z'));
        axis.append(text('span', '', fmt(days[0].date)), text('span', '', fmt(days[days.length - 1].date)));
      }

      function replaceList(id, items, render, emptyMessage) {
        const list = element(id);
        list.replaceChildren();
        if (!items.length) {
          list.append(text('li', 'empty', emptyMessage));
          return;
        }
        items.forEach((item) => list.append(render(item)));
      }

      function activateView(scrollToTop = false) {
        const requested = window.location.hash.slice(1);
        const view = Object.hasOwn(views, requested) ? requested : 'overview';
        if (view !== requested) window.history.replaceState(null, '', '#' + view);

        document.querySelectorAll('[data-view-panel]').forEach((panel) => {
          panel.hidden = panel.dataset.viewPanel !== view;
        });
        document.querySelectorAll('[data-view-link]').forEach((link) => {
          if (link.dataset.viewLink === view) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        });
        element('page-title').textContent = views[view].title;
        element('page-description').textContent = views[view].description;
        document.title = views[view].title + ' · Beacon';
        if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      function activateHistoryTab(tab) {
        document.querySelectorAll('[data-history-panel]').forEach((panel) => {
          panel.hidden = panel.dataset.historyPanel !== tab;
        });
        document.querySelectorAll('[data-history-tab]').forEach((button) => {
          button.setAttribute('aria-selected', button.dataset.historyTab === tab ? 'true' : 'false');
        });
      }

      function renderSignal(signal) {
        const item = text('li', 'list-item attend' + (signal.level === 'warning' ? ' is-warning' : ''), '');
        const top = text('div', 'signal-top', '');
        top.append(text('p', 'signal-title', signal.title), text('span', 'badge ' + signal.level, levelLabels[signal.level]));
        item.append(top, text('p', 'signal-detail', signal.detail));
        const action = text('p', 'next-action', '');
        action.append(text('span', 'next-action-label', '이렇게 해보세요'), text('span', '', signal.nextAction));
        item.append(action);
        item.append(text('div', 'source', '근거 · ' + signal.sources.join(', ')));
        return item;
      }

      function renderReadySignal(signal) {
        const row = text('div', 'signal-ready', '');
        row.append(text('span', 'dot', ''));
        row.append(text('p', 'signal-ready-title', signal.title));
        row.append(text('div', 'signal-ready-source', signal.sources.join(', ')));
        return row;
      }

      function renderSignals(signals) {
        const attend = signals.filter((signal) => signal.level !== 'ready');
        const ready = signals.filter((signal) => signal.level === 'ready');
        const counts = { warning: 0, attention: 0, ready: ready.length };
        attend.forEach((signal) => { counts[signal.level] = (counts[signal.level] || 0) + 1; });

        element('signal-count').textContent = attend.length > 0
          ? attend.length + '개 챙기면 완성'
          : '기본 점검 통과 ✓';

        const summary = element('signal-summary');
        summary.replaceChildren();
        [['warning', '보완 권장'], ['attention', '확인 권장'], ['ready', '완료']].forEach(([level, label]) => {
          if (!counts[level]) return;
          const pill = text('span', 'summary-pill ' + level, '');
          pill.append(text('span', 'dot', ''), text('span', '', label + ' ' + counts[level]));
          summary.append(pill);
        });

        element('attend-label').hidden = attend.length === 0;
        const attendList = element('signals-attend');
        attendList.replaceChildren();
        if (attend.length === 0) attendList.append(text('li', 'signal-clear', '지금 챙길 것이 없어요. 기본 점검을 모두 통과했습니다. 👍'));
        else attend.forEach((signal) => attendList.append(renderSignal(signal)));

        element('ready-label').hidden = ready.length === 0;
        const readyBox = element('signals-ready');
        readyBox.replaceChildren();
        ready.forEach((signal) => readyBox.append(renderReadySignal(signal)));
      }

      const artifactKindOrder = ['overview', 'planning', 'architecture', 'quality', 'release', 'document'];
      const artifactKindStage = { overview: 'P0', planning: 'P0', architecture: 'P1', quality: 'P3', release: 'P4', document: null };

      function renderArtifactFile(artifact) {
        const row = text('div', 'afile', '');
        row.append(text('span', 'afile-name', artifact.name), text('span', 'afile-path', artifact.path));
        return row;
      }

      function renderArtifacts(projectArtifacts, supportArtifacts) {
        const groups = element('artifact-groups');
        groups.replaceChildren();
        const byKind = {};
        projectArtifacts.forEach((a) => { (byKind[a.kind] = byKind[a.kind] || []).push(a); });

        artifactKindOrder.forEach((kind) => {
          const files = byKind[kind] || [];
          // 문서(document)는 실제로 있을 때만 그룹을 만든다.
          if (kind === 'document' && files.length === 0) return;
          const group = text('div', 'agroup', '');
          const head = text('div', 'agroup-head', '');
          head.append(text('span', 'agroup-name', kindLabels[kind] || '문서'));
          if (artifactKindStage[kind]) head.append(text('span', 'agroup-stage', artifactKindStage[kind] + ' 근거'));
          head.append(text('span', 'agroup-count', files.length + '개'));
          group.append(head);
          if (files.length === 0) {
            group.append(text('div', 'agroup-empty', '아직 없어요.'));
          } else {
            files.forEach((a) => group.append(renderArtifactFile(a)));
          }
          groups.append(group);
        });

        const supportBox = element('artifact-support');
        supportBox.replaceChildren();
        if (supportArtifacts.length > 0) {
          const details = text('details', 'support-wrap', '');
          details.append(text('summary', '', '도구·설정 문서 ' + supportArtifacts.length + '개 (판정에는 쓰지 않음)'));
          supportArtifacts.forEach((a) => details.append(renderArtifactFile(a)));
          supportBox.append(details);
        }
      }

      function renderTimelineEvent(event) {
        const item = text('li', 'list-item', '');
        const row = text('div', 'timeline-row', '');
        const content = text('div', '', '');
        content.append(text('p', 'timeline-title', event.title), text('p', 'signal-detail', event.detail));
        if (event.relatedArtifacts.length) content.append(text('div', 'artifact-path', '문서 · ' + event.relatedArtifacts.join(', ')));
        content.append(text('div', 'source', '근거 · ' + event.source + ':' + event.reference));
        const side = text('div', 'timeline-side', '');
        const date = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(event.occurredAt));
        side.append(text('span', 'timeline-category', categoryLabels[event.category] || '변경'), text('span', 'timeline-meta', date));
        row.append(content, side);
        item.append(row);
        return item;
      }

      function groupByDay(events) {
        const buckets = new Map();
        events.forEach((event) => {
          const date = event.occurredAt.slice(0, 10);
          if (buckets.has(date)) buckets.get(date).push(event);
          else buckets.set(date, [event]);
        });
        return [...buckets.entries()]
          .sort((left, right) => right[0].localeCompare(left[0]))
          .map(([date, dayEvents]) => {
            const ordered = [...dayEvents].sort((left, right) => {
              const diff = Date.parse(right.occurredAt) - Date.parse(left.occurredAt);
              return diff || left.id.localeCompare(right.id);
            });
            const counts = {};
            ordered.forEach((event) => { counts[event.category] = (counts[event.category] || 0) + 1; });
            return { date, total: ordered.length, categoryCounts: counts, events: ordered };
          });
      }

      function renderDay(day) {
        const item = text('li', 'list-item', '');
        const top = text('div', 'day-top', '');
        const label = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(day.date + 'T00:00:00Z'));
        top.append(text('p', 'day-date', label), text('span', 'day-total', day.total + '건'));
        item.append(top);
        const categories = text('div', 'day-categories', '');
        Object.keys(day.categoryCounts).forEach((category) => {
          categories.append(text('span', 'day-category', (categoryLabels[category] || '변경') + ' ' + day.categoryCounts[category]));
        });
        item.append(categories);

        const details = text('details', 'day-events', '');
        details.append(text('summary', '', '이 날 한 일 ' + day.total + '건 보기'));
        day.events.forEach((event) => {
          const row = text('div', 'day-event', '');
          const content = text('div', '', '');
          content.append(text('p', 'day-event-title', event.title));
          content.append(text('div', 'day-event-source', '근거 · ' + event.source + ':' + event.reference));
          const side = text('div', 'day-event-side', '');
          const time = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.occurredAt));
          side.append(text('span', 'timeline-category', categoryLabels[event.category] || '변경'), text('span', 'day-event-time', time));
          row.append(content, side);
          details.append(row);
        });
        item.append(details);
        return item;
      }

      function renderChange(change) {
        const item = text('li', 'list-item', '');
        const top = text('div', 'signal-top', '');
        top.append(text('p', 'signal-title', change.title), text('span', 'badge ' + change.kind, changeLabels[change.kind]));
        item.append(top, text('p', 'signal-detail', change.detail));
        const date = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(change.detectedAt));
        item.append(text('div', 'source', '근거 · ' + change.source + ':' + change.reference + ' · ' + date));
        return item;
      }

      function stageCode(stageId) {
        return stageId ? String(stageId).toUpperCase() : '완료';
      }

      function renderCycle(cycle) {
        const item = text('li', 'list-item', '');
        const top = text('div', 'signal-top', '');
        const heading = text('div', '', '');
        heading.append(text('span', 'cycle-number', 'CYCLE ' + String(cycle.sequence).padStart(2, '0')));
        heading.append(text('p', 'signal-title', cycle.name));
        const isActive = cycle.status === 'active';
        top.append(heading, text('span', 'badge ' + (isActive ? 'active' : 'completed'), isActive ? '진행 중' : '완료'));
        item.append(top);
        item.append(text('p', 'cycle-goal-line', cycle.goal));

        const fmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
        const period = fmt.format(new Date(cycle.startedAt)) + ' → ' + (cycle.completedAt ? fmt.format(new Date(cycle.completedAt)) : '진행 중');

        const result = cycle.result;
        if (result) {
          const deltas = text('div', 'cycle-deltas', '');
          deltas.append(text('span', 'cycle-delta', '산출물 +' + result.artifactsAdded + ' / ~' + result.artifactsModified + ' / -' + result.artifactsDeleted));
          deltas.append(text('span', 'cycle-delta', 'commit +' + result.newCommits));
          deltas.append(text('span', 'cycle-delta', 'Health ' + result.healthBefore.score + ' → ' + result.healthAfter.score));
          deltas.append(text('span', 'cycle-delta', 'Gate ' + stageCode(result.gateBefore) + ' → ' + stageCode(result.gateAfter)));
          item.append(deltas);
        }
        if (cycle.summary) item.append(text('p', 'cycle-summary-note', '요약 · ' + cycle.summary));
        item.append(text('div', 'source', '기간 · ' + period));
        return item;
      }

      function renderStage(stage) {
        const item = text('div', 'stage ' + stage.state, '');
        const top = text('div', 'stage-top', '');
        const iconChar = stage.state === 'ready' ? '✓' : stage.state === 'current' ? '●' : '';
        top.append(text('span', 'stage-code', stage.id.toUpperCase()), text('span', 'stage-icon', iconChar));
        item.append(top);
        item.append(text('strong', 'stage-name', stage.name));
        item.append(text('span', 'stage-hint', stageHints[stage.id] || ''));
        item.append(text('span', 'stage-state', stageStateLabels[stage.state] + ' · ' + stage.gate.satisfiedRequirements + '/' + stage.gate.totalRequirements));
        return item;
      }

      function renderRequirement(requirement) {
        const item = text('div', 'requirement' + (requirement.satisfied ? ' satisfied' : ''), '');
        const content = text('div', '', '');
        content.append(text('p', 'requirement-title', requirement.label));
        content.append(text('p', 'requirement-evidence', requirement.evidence.join(' · ')));
        item.append(text('span', 'requirement-dot', requirement.satisfied ? '✓' : '!'), content);
        item.append(text('span', 'requirement-action', requirement.satisfied ? '확인됨' : requirement.nextAction));
        return item;
      }

      function renderProcess(process) {
        const stages = element('stages');
        stages.replaceChildren(...process.stages.map(renderStage));

        const done = process.readyStages;
        element('process-count').textContent = process.totalStages + '단계 중 ' + done + '단계 완료';
        element('progress-fill').style.width = Math.round((done / process.totalStages) * 100) + '%';
        element('progress-text').textContent = done + ' / ' + process.totalStages;

        const focus = process.stages.find((stage) => stage.id === process.currentStageId) || process.stages.at(-1);
        if (!focus) return;
        const isCurrent = Boolean(process.currentStageId);
        element('gate-eyebrow').textContent = isCurrent ? '지금 확인할 단계' : '모든 단계 준비 완료';
        element('gate-eyebrow').className = 'eyebrow' + (isCurrent ? ' gate-eyebrow-current' : '');
        element('gate-title').textContent = isCurrent
          ? focus.id.toUpperCase() + ' · ' + focus.name + ' — 여기부터 채우면 다음 단계로 넘어가요'
          : '기획부터 배포까지 자동 근거가 모두 준비됐어요 🎉';
        element('gate-objective').textContent = focus.objective;
        const requirements = element('requirements');
        requirements.replaceChildren(...focus.gate.requirements.map(renderRequirement));
      }

      async function loadProject() {
        element('refresh').disabled = true;
        element('status').textContent = '스캔 중';
        element('error').hidden = true;

        try {
          const responses = await Promise.all([
            fetch('/api/identity', { cache: 'no-store' }),
            fetch('/api/snapshot', { cache: 'no-store' }),
            fetch('/api/journey', { cache: 'no-store' }),
          ]);
          if (responses.some((response) => !response.ok)) throw new Error('project request failed');

          const identity = await responses[0].json();
          const snapshot = await responses[1].json();
          const journey = await responses[2].json();
          const historyResponse = await fetch('/api/history?limit=100', { cache: 'no-store' });
          if (!historyResponse.ok) throw new Error('history request failed');
          const history = await historyResponse.json();
          const observation = snapshot.observation;
          const projectArtifacts = observation.files.artifacts.filter((artifact) => artifact.scope !== 'support');
          const supportArtifacts = observation.files.artifacts.filter((artifact) => artifact.scope === 'support');
          const activeCycle = journey.cycles.find((cycle) => cycle.status === 'active');

          element('name').textContent = identity.name;
          element('sidebar-project-name').textContent = identity.name;
          const rootParts = identity.root.split('/').filter(Boolean);
          element('root').textContent = (rootParts.length > 2 ? '…/' : '/') + rootParts.slice(-2).join('/');
          element('branch').textContent = identity.gitBranch ? 'Branch · ' + identity.gitBranch : 'Git 저장소 아님';
          element('head').textContent = identity.gitHead ? 'HEAD · ' + identity.gitHead : 'HEAD · —';
          element('scanned').textContent = '스캔 · ' + new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date(snapshot.scannedAt));
          element('history-count').textContent = '기준선 · ' + history.snapshotCount + '회';

          if (activeCycle) {
            element('cycle-name').textContent = activeCycle.name;
            element('cycle-goal').textContent = activeCycle.goal;
            element('cycle-number').textContent = 'CYCLE ' + String(activeCycle.sequence).padStart(2, '0') + ' · 진행 중';
            element('cycle-started').textContent = '시작 · ' + new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activeCycle.startedAt));
            element('cycle-baseline').textContent = '시작 기준선 · Snapshot #' + activeCycle.baseline.snapshotId;
            element('cycle-artifacts').textContent = '시작 산출물 · ' + activeCycle.baseline.artifactPaths.length + '개';
            element('sidebar-cycle').textContent = 'Cycle ' + String(activeCycle.sequence).padStart(2, '0') + ' · ' + activeCycle.name;
          } else {
            element('cycle-name').textContent = '아직 시작한 Cycle이 없습니다.';
            element('cycle-goal').textContent = 'beacon cycle start로 이번에 완성할 목표(마일스톤) 하나를 시작하세요.';
            element('cycle-number').textContent = journey.cycles.length + ' cycles';
            element('cycle-started').textContent = '시작 시점 · —';
            element('cycle-baseline').textContent = '기준선 · —';
            element('cycle-artifacts').textContent = '시작 산출물 · —';
            element('sidebar-cycle').textContent = '진행 중인 Cycle 없음';
          }

          element('nav-overview-count').textContent = snapshot.health.score + '%';
          element('nav-process-count').textContent = snapshot.process.currentStageId ? snapshot.process.currentStageId.toUpperCase() : 'Ready';
          element('nav-artifact-count').textContent = String(projectArtifacts.length);
          element('nav-history-count').textContent = String(history.timelineCount);
          renderProcess(snapshot.process);
          renderStageDonut(snapshot.process);
          renderHealthBars(snapshot.health);
          renderActivityArea(history.timeline);

          renderSignals(snapshot.health.signals);
          element('artifact-label').textContent = '핵심 ' + projectArtifacts.length + '개 · 지원 ' + supportArtifacts.length + '개';
          element('timeline-label').textContent = history.timeline.length + (history.timeline.length < history.timelineCount ? ' / ' + history.timelineCount : '') + '건';
          element('change-label').textContent = history.changes.length + (history.changes.length < history.changeCount ? ' / ' + history.changeCount : '') + '건';
          renderArtifacts(projectArtifacts, supportArtifacts);
          replaceList('timeline', history.timeline, renderTimelineEvent, '아직 표시할 commit이나 문서 변경이 없어요.');
          const days = groupByDay(history.timeline);
          element('daily-label').textContent = days.length + '일';
          element('tab-daily-count').textContent = String(days.length);
          replaceList('daily', days, renderDay, '아직 기록된 작업이 없어요. commit하거나 문서를 저장하면 여기에 쌓입니다.');
          replaceList('changes', history.changes, renderChange, '첫 스캔은 기준선으로 저장돼요. 다음 스캔부터 추가·변경·삭제가 여기 쌓입니다.');
          element('tab-detail-count').textContent = String(history.timeline.length);
          const orderedCycles = [...journey.cycles].sort((left, right) => right.sequence - left.sequence);
          element('cycle-log-label').textContent = orderedCycles.length + '개';
          element('tab-cycle-count').textContent = String(orderedCycles.length);
          replaceList('cycle-log', orderedCycles, renderCycle, '완성할 목표(마일스톤) 하나를 beacon cycle start로 시작하면, 여기에 시작–완성 로그가 쌓입니다.');
          element('status').textContent = '연결됨';
          element('status').className = 'status';
        } catch {
          element('status').textContent = '연결 끊김';
          element('status').className = 'status offline';
          element('error').hidden = false;
          element('error').textContent = '프로젝트를 스캔하지 못했습니다. Beacon을 실행한 터미널에서 경로와 권한을 확인하세요.';
        } finally {
          element('refresh').disabled = false;
        }
      }

      element('refresh').addEventListener('click', loadProject);
      document.querySelectorAll('[data-view-link]').forEach((link) => {
        link.addEventListener('click', () => {
          if (window.location.hash === link.getAttribute('href')) activateView(true);
        });
      });
      document.querySelectorAll('[data-history-tab]').forEach((button) => {
        button.addEventListener('click', () => activateHistoryTab(button.dataset.historyTab));
      });
      window.addEventListener('hashchange', () => activateView(true));

      // 자동 스캔: 켜면 일정 간격으로 다시 스캔해 진행 중 변화를 자동으로 쌓는다.
      const AUTO_SCAN_INTERVAL_MS = 15000;
      let autoScanTimer = null;
      element('auto-scan').addEventListener('change', (event) => {
        if (event.target.checked) {
          autoScanTimer = setInterval(() => { if (!document.hidden) loadProject(); }, AUTO_SCAN_INTERVAL_MS);
        } else if (autoScanTimer) {
          clearInterval(autoScanTimer);
          autoScanTimer = null;
        }
      });

      activateView();
      activateHistoryTab('daily');
      loadProject();
    </script>
  </body>
</html>`;
}
