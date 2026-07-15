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
      main { width: min(960px, calc(100% - 40px)); margin: 0 auto; padding: 64px 0; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
      .brand { color: #5b43ff; font-size: 14px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      h1 { margin: 8px 0 0; font-size: clamp(32px, 5vw, 52px); letter-spacing: -.04em; }
      .status { border: 1px solid #c9f1df; background: #edfbf5; color: #08764d; border-radius: 999px; padding: 8px 12px; font-size: 13px; font-weight: 700; }
      .card { background: #fff; border: 1px solid #dedfe3; border-radius: 20px; padding: 28px; box-shadow: 0 12px 36px rgb(23 25 29 / 6%); }
      .eyebrow { color: #777b85; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      h2 { margin: 10px 0 8px; font-size: 26px; }
      .root { margin: 0; color: #6c707a; overflow-wrap: anywhere; }
      dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin: 28px 0 0; background: #e5e6e9; border: 1px solid #e5e6e9; border-radius: 14px; overflow: hidden; }
      dl div { background: #fafafa; padding: 18px; }
      dt { color: #777b85; font-size: 12px; margin-bottom: 7px; }
      dd { margin: 0; font-weight: 700; }
      .next { margin-top: 24px; padding: 18px; border-left: 3px solid #5b43ff; background: #f6f3ff; border-radius: 0 12px 12px 0; }
      .next strong { display: block; margin-bottom: 5px; }
      .next p { margin: 0; color: #5f5875; }
      @media (max-width: 640px) { main { padding-top: 36px; } header { align-items: flex-start; } dl { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div><div class="brand">Beacon</div><h1>프로젝트 개요</h1></div>
        <div class="status" id="status">프로젝트 확인 중</div>
      </header>
      <section class="card" aria-live="polite">
        <div class="eyebrow">Project Identity</div>
        <h2 id="name">불러오는 중…</h2>
        <p class="root" id="root"></p>
        <dl>
          <div><dt>Git branch</dt><dd id="branch">—</dd></div>
          <div><dt>Git commit</dt><dd id="head">—</dd></div>
        </dl>
        <div class="next">
          <strong>첫 번째 Beacon 신호</strong>
          <p>현재는 프로젝트 정체성을 자동으로 읽습니다. 다음 세로 흐름에서 파일과 Git 탐색 결과를 연결합니다.</p>
        </div>
      </section>
    </main>
    <script>
      fetch('/api/identity')
        .then((response) => {
          if (!response.ok) throw new Error('identity request failed');
          return response.json();
        })
        .then((identity) => {
          document.querySelector('#name').textContent = identity.name;
          document.querySelector('#root').textContent = identity.root;
          document.querySelector('#branch').textContent = identity.gitBranch ?? 'Git 저장소 아님';
          document.querySelector('#head').textContent = identity.gitHead ?? '—';
          document.querySelector('#status').textContent = '연결됨';
        })
        .catch(() => {
          document.querySelector('#name').textContent = '프로젝트를 읽지 못했습니다';
          document.querySelector('#status').textContent = '확인 필요';
        });
    </script>
  </body>
</html>`;
}

