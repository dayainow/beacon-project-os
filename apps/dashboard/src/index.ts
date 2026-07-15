export function renderDashboard(): string {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Beacon</title>
    <style>
      :root { color-scheme: light; font-family: Inter, Pretendard, system-ui, sans-serif; background: #f5f6f8; color: #17191d; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; }
      button { font: inherit; }
      main { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 52px 0 72px; }
      header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
      .brand { color: #5b43ff; font-size: 13px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
      h1 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 52px); letter-spacing: -.045em; }
      .header-actions { display: flex; align-items: center; gap: 10px; }
      .status { border: 1px solid #ddd8ff; background: #f5f2ff; color: #5b43ff; border-radius: 999px; padding: 9px 12px; font-size: 12px; font-weight: 800; }
      .refresh { border: 1px solid #d8d9dd; background: #fff; border-radius: 10px; padding: 9px 13px; color: #34373d; cursor: pointer; font-weight: 700; }
      .refresh:hover { border-color: #9d91ff; }
      .refresh:disabled { cursor: wait; opacity: .55; }
      .card { background: #fff; border: 1px solid #dedfe3; border-radius: 18px; box-shadow: 0 10px 30px rgb(23 25 29 / 5%); }
      .identity { padding: 26px; }
      .eyebrow { color: #777b85; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      h2 { margin: 8px 0 6px; font-size: 25px; letter-spacing: -.025em; }
      .root { margin: 0; color: #6c707a; font-size: 13px; overflow-wrap: anywhere; }
      .identity-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      .chip { border: 1px solid #e1e2e5; background: #fafafa; border-radius: 999px; padding: 7px 10px; font-size: 12px; color: #555962; }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 12px 0; }
      .metric { padding: 20px; min-height: 118px; }
      .metric-value { display: block; margin-top: 12px; font-size: 28px; font-weight: 850; letter-spacing: -.04em; }
      .metric-note { display: block; margin-top: 4px; color: #777b85; font-size: 12px; }
      .health-card { border-left: 4px solid #5b43ff; }
      .health-card.attention { border-left-color: #f0a100; }
      .health-card.at_risk { border-left-color: #df4b57; }
      .process { margin-bottom: 12px; overflow: hidden; }
      .stage-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; padding: 20px 24px; }
      .stage { min-height: 116px; border: 1px solid #e2e3e6; border-radius: 13px; padding: 15px; background: #fafafa; }
      .stage.ready { border-color: #bdebd7; background: #effbf5; }
      .stage.current { border-color: #8f7fff; background: #f6f3ff; box-shadow: inset 0 0 0 1px #8f7fff; }
      .stage-code { color: #777b85; font: 10px ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; }
      .stage-name { display: block; margin-top: 9px; font-size: 15px; }
      .stage-state { display: block; margin-top: 16px; color: #777b85; font-size: 11px; }
      .stage.ready .stage-state { color: #08764d; }
      .stage.current .stage-state { color: #5b43ff; font-weight: 800; }
      .gate-focus { border-top: 1px solid #ececef; padding: 20px 24px 24px; background: #fcfcfd; }
      .gate-focus h3 { margin: 6px 0 4px; font-size: 17px; }
      .gate-objective { margin: 0; color: #777b85; font-size: 12px; }
      .requirements { display: grid; gap: 8px; margin-top: 16px; }
      .requirement { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: start; padding: 12px; border: 1px solid #e4e5e8; background: #fff; border-radius: 10px; }
      .requirement-dot { width: 9px; height: 9px; margin-top: 5px; border-radius: 50%; background: #df4b57; }
      .requirement.satisfied .requirement-dot { background: #13a76f; }
      .requirement-title { margin: 0; font-size: 13px; font-weight: 800; }
      .requirement-evidence { margin: 4px 0 0; color: #777b85; font-size: 11px; line-height: 1.45; }
      .requirement-action { color: #5b43ff; font-size: 11px; text-align: right; max-width: 270px; }
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
      .next-action { margin: 12px 0 0; padding: 10px 12px; border-radius: 9px; background: #f7f5ff; color: #514875; font-size: 12px; line-height: 1.5; }
      .source { margin-top: 9px; color: #9699a1; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
      .artifact-row, .timeline-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .artifact-kind { color: #5b43ff; font-size: 10px; font-weight: 800; text-transform: uppercase; }
      .artifact-path { margin-top: 5px; color: #858892; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
      .timeline-side { display: grid; justify-items: end; gap: 7px; }
      .timeline-category { border-radius: 999px; padding: 5px 8px; background: #f2efff; color: #5b43ff; font-size: 10px; font-weight: 850; white-space: nowrap; }
      .timeline-meta { color: #8a8d95; font-size: 11px; white-space: nowrap; }
      .timeline { margin-top: 12px; }
      .changes { margin-top: 12px; }
      .empty { padding: 28px 24px; color: #777b85; font-size: 13px; }
      .error { padding: 20px; background: #fff0f1; color: #9d1f2c; border: 1px solid #f3c9ce; border-radius: 14px; }
      @media (max-width: 860px) { .metrics { grid-template-columns: repeat(2, 1fr); } .stage-grid { grid-template-columns: repeat(2, 1fr); } .layout { grid-template-columns: 1fr; } }
      @media (max-width: 560px) { main { width: min(100% - 24px, 1120px); padding-top: 28px; } header { align-items: flex-start; flex-direction: column; } .metrics, .stage-grid { grid-template-columns: 1fr; } .metric { min-height: auto; } .requirement { grid-template-columns: auto minmax(0, 1fr); } .requirement-action { grid-column: 2; text-align: left; max-width: none; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div><div class="brand">Beacon</div><h1>프로젝트 개요</h1></div>
        <div class="header-actions">
          <div class="status" id="status">프로젝트 확인 중</div>
          <button class="refresh" id="refresh" type="button">다시 스캔</button>
        </div>
      </header>

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

      <section class="metrics" aria-label="프로젝트 관찰 요약">
        <article class="card metric health-card" id="health-card"><div class="eyebrow">Project Health</div><strong class="metric-value" id="score">—</strong><span class="metric-note" id="headline">기준 확인 중</span></article>
        <article class="card metric"><div class="eyebrow">발견한 산출물</div><strong class="metric-value" id="artifact-count">—</strong><span class="metric-note">파일 경로에서 자동 발견</span></article>
        <article class="card metric"><div class="eyebrow">Timeline</div><strong class="metric-value" id="timeline-count">—</strong><span class="metric-note">문서와 Git의 의미 단위 이벤트</span></article>
        <article class="card metric"><div class="eyebrow">작업 중 변경</div><strong class="metric-value" id="change-count">—</strong><span class="metric-note">아직 commit되지 않은 경로</span></article>
      </section>

      <div id="error" class="error" hidden></div>

      <section class="card process">
        <div class="panel-head"><div><div class="eyebrow">P0–P4 Process</div><h2>단계와 Gate 준비도</h2></div><span class="count" id="process-count">0 / 5 ready</span></div>
        <div class="stage-grid" id="stages"></div>
        <div class="gate-focus">
          <div class="eyebrow">Current Gate</div>
          <h3 id="gate-title">단계 근거를 확인하고 있습니다.</h3>
          <p class="gate-objective" id="gate-objective"></p>
          <div class="requirements" id="requirements"></div>
        </div>
      </section>

      <section class="layout">
        <article class="card panel">
          <div class="panel-head"><div><div class="eyebrow">Beacon Signals</div><h2>부족한 부분과 다음 행동</h2></div><span class="count" id="signal-count">0 signals</span></div>
          <ul class="list" id="signals"><li class="empty">프로젝트 신호를 계산하고 있습니다.</li></ul>
        </article>

        <article class="card panel">
          <div class="panel-head"><div><div class="eyebrow">Deliverables</div><h2>발견한 산출물</h2></div><span class="count" id="artifact-label">0 files</span></div>
          <ul class="list" id="artifacts"><li class="empty">산출물을 찾고 있습니다.</li></ul>
        </article>
      </section>

      <section class="card panel timeline">
        <div class="panel-head"><div><div class="eyebrow">Project Timeline</div><h2>작업과 산출물의 흐름</h2></div><span class="count" id="timeline-label">0 events</span></div>
        <ul class="list" id="timeline"><li class="empty">프로젝트 흐름을 구성하고 있습니다.</li></ul>
      </section>

      <section class="card panel changes">
        <div class="panel-head"><div><div class="eyebrow">Append-only Activity</div><h2>스캔 사이의 변화</h2></div><span class="count" id="change-label">0 changes</span></div>
        <ul class="list" id="changes"><li class="empty">첫 스캔은 기준선으로 저장됩니다.</li></ul>
      </section>
    </main>
    <script>
      const element = (id) => document.getElementById(id);
      const kindLabels = { overview: '개요', planning: '기획', architecture: '설계', quality: '검증', release: '릴리스', document: '문서' };
      const levelLabels = { warning: '보완 필요', attention: '확인 필요', ready: '준비됨' };
      const categoryLabels = { planning: '기획', design: '설계', implementation: '기능', issue: '문제 해결', quality: '검증', delivery: '릴리스', operations: '운영', documentation: '문서', change: '변경' };
      const changeLabels = { added: '추가', modified: '변경', deleted: '삭제' };
      const stageStateLabels = { ready: '자동 근거 준비', current: '현재 확인 단계', upcoming: '후속 단계' };

      function text(tag, className, value) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        node.textContent = value;
        return node;
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

      function renderSignal(signal) {
        const item = text('li', 'list-item', '');
        const top = text('div', 'signal-top', '');
        top.append(text('p', 'signal-title', signal.title), text('span', 'badge ' + signal.level, levelLabels[signal.level]));
        item.append(top, text('p', 'signal-detail', signal.detail));
        item.append(text('p', 'next-action', '다음 행동 · ' + signal.nextAction));
        item.append(text('div', 'source', '출처 · ' + signal.sources.join(', ')));
        return item;
      }

      function renderArtifact(artifact) {
        const item = text('li', 'list-item', '');
        const row = text('div', 'artifact-row', '');
        const content = text('div', '', '');
        content.append(text('p', 'artifact-name', artifact.name), text('div', 'artifact-path', artifact.path));
        row.append(content, text('span', 'artifact-kind', kindLabels[artifact.kind] || '문서'));
        item.append(row);
        return item;
      }

      function renderTimelineEvent(event) {
        const item = text('li', 'list-item', '');
        const row = text('div', 'timeline-row', '');
        const content = text('div', '', '');
        content.append(text('p', 'timeline-title', event.title), text('p', 'signal-detail', event.detail));
        if (event.relatedArtifacts.length) content.append(text('div', 'artifact-path', '산출물 · ' + event.relatedArtifacts.join(', ')));
        content.append(text('div', 'source', '출처 · ' + event.source + ':' + event.reference));
        const side = text('div', 'timeline-side', '');
        const date = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(event.occurredAt));
        side.append(text('span', 'timeline-category', categoryLabels[event.category] || '변경'), text('span', 'timeline-meta', date));
        row.append(content, side);
        item.append(row);
        return item;
      }

      function renderChange(change) {
        const item = text('li', 'list-item', '');
        const top = text('div', 'signal-top', '');
        top.append(text('p', 'signal-title', change.title), text('span', 'badge ' + change.kind, changeLabels[change.kind]));
        item.append(top, text('p', 'signal-detail', change.detail));
        const date = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(change.detectedAt));
        item.append(text('div', 'source', '출처 · ' + change.source + ':' + change.reference + ' · ' + date));
        return item;
      }

      function renderStage(stage) {
        const item = text('div', 'stage ' + stage.state, '');
        item.append(text('span', 'stage-code', stage.id));
        item.append(text('strong', 'stage-name', stage.name));
        item.append(text('span', 'stage-state', stageStateLabels[stage.state] + ' · ' + stage.gate.satisfiedRequirements + '/' + stage.gate.totalRequirements));
        return item;
      }

      function renderRequirement(requirement) {
        const item = text('div', 'requirement' + (requirement.satisfied ? ' satisfied' : ''), '');
        const content = text('div', '', '');
        content.append(text('p', 'requirement-title', requirement.label));
        content.append(text('p', 'requirement-evidence', requirement.evidence.join(' · ')));
        item.append(text('span', 'requirement-dot', ''), content);
        item.append(text('span', 'requirement-action', requirement.satisfied ? '근거 확인됨' : requirement.nextAction));
        return item;
      }

      function renderProcess(process) {
        const stages = element('stages');
        stages.replaceChildren(...process.stages.map(renderStage));
        element('process-count').textContent = process.readyStages + ' / ' + process.totalStages + ' ready';
        const focus = process.stages.find((stage) => stage.id === process.currentStageId) || process.stages.at(-1);
        if (!focus) return;
        element('gate-title').textContent = process.currentStageId
          ? focus.id.toUpperCase() + ' ' + focus.name + ' Gate · 증거 확인 필요'
          : 'P0–P4 자동 근거가 모두 준비되었습니다';
        element('gate-objective').textContent = focus.objective + ' 자동 관찰 결과이며 Gate 승인을 대신하지 않습니다.';
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
          ]);
          if (responses.some((response) => !response.ok)) throw new Error('project request failed');

          const identity = await responses[0].json();
          const snapshot = await responses[1].json();
          const historyResponse = await fetch('/api/history?limit=100', { cache: 'no-store' });
          if (!historyResponse.ok) throw new Error('history request failed');
          const history = await historyResponse.json();
          const observation = snapshot.observation;

          element('name').textContent = identity.name;
          element('root').textContent = identity.root;
          element('branch').textContent = identity.gitBranch ? 'Branch · ' + identity.gitBranch : 'Git 저장소 아님';
          element('head').textContent = identity.gitHead ? 'HEAD · ' + identity.gitHead : 'HEAD · —';
          element('scanned').textContent = '스캔 · ' + new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date(snapshot.scannedAt));
          element('history-count').textContent = '기준선 · ' + history.snapshotCount + '회';

          element('score').textContent = snapshot.health.score + '%';
          element('headline').textContent = snapshot.health.headline;
          element('artifact-count').textContent = String(observation.files.artifacts.length);
          element('timeline-count').textContent = String(history.timelineCount);
          element('change-count').textContent = String(observation.git.changedFiles.length);
          element('health-card').className = 'card metric health-card ' + snapshot.health.status;
          renderProcess(snapshot.process);

          element('signal-count').textContent = snapshot.health.signals.length + ' signals';
          element('artifact-label').textContent = observation.files.artifacts.length + ' files';
          element('timeline-label').textContent = history.timeline.length + (history.timeline.length < history.timelineCount ? ' / ' + history.timelineCount : '') + ' events';
          element('change-label').textContent = history.changes.length + (history.changes.length < history.changeCount ? ' / ' + history.changeCount : '') + ' changes';
          replaceList('signals', snapshot.health.signals, renderSignal, '현재 표시할 신호가 없습니다.');
          replaceList('artifacts', observation.files.artifacts.slice(0, 8), renderArtifact, '발견한 문서 산출물이 없습니다.');
          replaceList('timeline', history.timeline, renderTimelineEvent, '아직 표시할 문서 수정이나 Git commit이 없습니다.');
          replaceList('changes', history.changes, renderChange, '첫 스캔을 기준선으로 저장했습니다. 다음 스캔부터 추가·변경·삭제를 기록합니다.');
          element('status').textContent = '연결됨';
        } catch {
          element('status').textContent = '확인 필요';
          element('error').hidden = false;
          element('error').textContent = '프로젝트를 스캔하지 못했습니다. Beacon을 실행한 터미널에서 경로와 권한을 확인하세요.';
        } finally {
          element('refresh').disabled = false;
        }
      }

      element('refresh').addEventListener('click', loadProject);
      loadProject();
    </script>
  </body>
</html>`;
}
