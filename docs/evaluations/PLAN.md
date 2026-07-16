# Beacon 개발 계획 — 시간 축 완성

| 항목 | 내용 |
|---|---|
| 작성일 | 2026-07-15 (2026-07-16 방향 재정렬) |
| 상태 | 방향 확정 — **시간 축(Cycle 종료·통합 로그) 우선** |
| 기준 Beacon | `v0.2.0` |
| 목적 | 프로젝트 시작부터 완성까지의 로그를 하나로 통합 관리한다. 지금까지 뭐가 됐고, 뭐가 빠졌고, 다음에 뭘 더할지를 시간 축 위에서 보여준다 |

> 이 문서는 Beacon을 **제품 목적**에 맞춰 완성하는 개발 순서를 정한다. 개별 외부 평가 결과는 번호가 붙은 `000N-*.md`에 남긴다.

## 제품 목적 (재확인)

Beacon은 다음을 한다.

1. **표준 가이드라인**(고정 P0–P4)에 비추어
2. 프로젝트가 **시작부터 현재까지 어디까지 완성됐는지** 보여주고
3. **뭘 더하면 좋을지**(다음 행동)를 붙이고
4. **하루하루 작업·변경을 기록·관리**하며
5. **초기부터 완성까지의 로그를 하나로 통합**해 — 잘됐나·안됐나·뭐가 빠졌나를 보게 한다.

## 현진단 (2026-07-16)

| 목적 | 현재 코드 | 상태 |
|---|---|---|
| 1. 표준 가이드라인 | `process.ts` 고정 P0–P4 + Gate | 🟢 충분 — 커스터마이징은 비목표로 확정 |
| 2. 어디까지 완성됐나 | `process.ts` currentStage + Health score | 🟢 가장 강함 (0001에서 검증) |
| 3. 뭘 더하면 좋을지 | 모든 signal/requirement의 `nextAction` | 🟢 강함 (단건 조언) |
| 4. 하루하루 기록 | `history.ts` diff + SQLite append-only | 🟡 저장은 되나 **일자별 뷰 없음** |
| 5. 초기~완성 통합 로그 | `journey.ts` Cycle + `projectBook.ts` export | 🔴 **가장 약함** |

**한 줄 진단:** "현재 상태 판정"(2·3)은 잘 작동한다. 그러나 "시작부터 완성까지의 시간 축"(4·5)이 약하다. Beacon은 지금 *스냅샷 카메라*에 가깝고, 목적은 *타임랩스*다.

### 시간 축이 약한 구체적 근거 (코드 기준)

- **Cycle이 시작만 되고 끝나지 않는다.** `ProjectCycle`에 `status: "completed"`와 `completedAt` 필드는 있으나, 이를 전이시키는 `completeCycle()`이 없다. CLI도 `start`/`status`만 연결돼 있다.
- **시작 기준선을 잡아만 두고 비교에 쓰지 않는다.** `startProjectCycle`이 `snapshotId`·`gitHead`·`artifactPaths`를 저장하지만, "Cycle 종료 시점 ↔ 시작 기준선"을 diff하는 경로가 없다. `diffProjectSnapshots`는 연속 스캔만 비교한다.
- **Project Book에 Cycle 차원이 없다.** `generateProjectBook`은 journey를 읽지 않는다. Cycle 요약도, Cycle별 분리도 없는 평면 스냅샷 문서다.
- **일자 단위 집계가 없다.** Timeline은 최대 30개 평면 목록이며 "특정 날짜에 무슨 일이 있었나"를 묶지 않는다.

## 개발 순서 (확정)

### 1순위 — 시간 축 완성 (목적 4·5) ★ 본체 — ✅ 완료 (2026-07-16)

시작–완성 로그를 닫는 심장. 세 단위로 분해한다. 세 단위(1-A·1-B·1-C) 모두 완료되어, Cycle이 시작→종료→통합 로그(대시보드·Project Book)까지 이어진다.

#### 1-A. Cycle 종료 (`completeProjectCycle`) — ✅ 완료 (2026-07-16)
- `completeProjectCycle(root, { startSnapshot, endSnapshot, endSnapshotId, summary })`를 `journey.ts`에 추가. 진행 중 Cycle을 `completed`로 전이하고 `completedAt`을 기록한다.
- 종료 시 **시작 기준선 ↔ 종료 스냅샷**을 기존 `diffProjectSnapshots`로 비교해 `CycleResult`를 만든다: 추가·변경·삭제 산출물 수, 새 commit 수, Health·Gate before→after, 준비 단계 before→after.
- 요약(`summary`)과 `result`를 `.beacon/journey.json`의 해당 Cycle에 버전 관리 가능한 원본으로 보존한다. 이전 버전 기록은 두 필드를 `null`로 정규화해 하위 호환한다.
- CLI: `beacon cycle complete [--summary "..."]`. 시작 기준선 Snapshot은 `historyStore.snapshotById`로 불러온다.
- **인수 조건 (충족):** 진행 중 Cycle이 없으면 종료를 거부한다. 종료 Cycle은 시작·종료 기준선과 그 사이 변화 요약을 함께 가진다. 재시작 시 새 순번으로 이어진다. 실제 CLI 드라이브에서 Health 60→80·Gate P0→P1로 확인.

#### 1-B. 통합 로그 뷰 (여러 Cycle을 하나로) — ✅ 완료 (2026-07-16)
- Dashboard 히스토리 화면 최상단에 **"Cycle 로그"** 섹션을 추가한다. 서버는 이미 `/api/journey`를 노출하므로 대시보드 렌더만 추가했다.
- `renderCycle`이 Cycle별 순번·이름·목표·상태(진행 중/완료)·기간·달성 요약(산출물 delta, commit 수, Health·Gate 이동)을 그린다. 완료 Cycle만 delta 행을 보여준다.
- **인수 조건 (충족):** 여러 Cycle이 있으면 최신 Cycle이 먼저 온다(sequence desc). 진행 중/종료를 badge로 구분한다. Cycle이 없으면 안내 문구로 폴백한다. 안전한 DOM 헬퍼만 사용해 `innerHTML` 없이 렌더한다. 라이브 서버 + DOM shim 실행으로 완료/진행중 두 Cycle 렌더를 실측 확인.

#### 1-C. Cycle을 Project Book에 반영 — ✅ 완료 (2026-07-16)
- `generateProjectBook`에 optional `cycles?`를 추가하고 **"프로젝트 Cycle" 표**를 렌더한다: 순번·이름·목표·상태·기간·달성 요약(산출물 delta, commit 수, Health·Gate 이동). 최신 Cycle이 먼저 온다.
- CLI `export`가 `readProjectJourney`로 cycles를 넘긴다.
- **인수 조건 (충족):** Cycle이 있으면 Book에 Cycle 섹션이 나타나고, 없으면 기존 평면 구조를 유지한다(optional 필드로 하위 호환). 실제 export 드라이브에서 절대 경로 유출 0건 확인.

### 2순위 — 일자별 작업 뷰 (목적 4)
- Timeline/변화를 날짜 단위로 롤업해 "오늘·어제 무엇을 했나"를 보여준다. 순수 파생 뷰이므로 저장 스키마 변경 없이 뷰 계층에서 집계한다.
- **성격:** 1순위가 닫히면 같은 데이터 위에 얹는 저위험 작업.

### 3순위 — 판정 잔여 오차 정비 (구 PLAN의 B)
0001에서 남은 판정 오차. 제품 본체가 아니라 정비이므로 언제든 끼워 넣는다.
- `product`를 파일명 전체 `PRODUCT`일 때만 인정하는 규칙이 실제 PRD(`prd-*.md`)를 누락하지 않는지 확인.
- Timeline `change` 잔여 4/20이 진짜 분류 불가인지 규칙 보강 여지가 있는지 확인.
- "5개 Health 기준 중 하나라도 부족 → attention"이 지나치게 보수적인지 실측 검증.

### 보류 — 평가 대상 확장 (구 PLAN의 A)
문서 없는 초기 프로젝트·monorepo·비-JS로 scanner 편향을 노출하는 트랙. 제품 시간 축이 닫힌 뒤 별도 외부 평가 사이클(`0002-*.md`)로 진행한다.

## 확정된 결정

- **시간 축 우선.** 구 PLAN이 "곁가지 별도 트랙"으로 밀어둔 Cycle 종료·통합 로그(구 C)를 제품 본체로 승격한다.
- **가이드라인은 고정 P0–P4로 충분.** 프로젝트별 커스터마이징은 비목표.

## 평가–업그레이드 루프 (유지)

외부 실측이 필요할 때 아래 절차를 반복 단위로 쓴다. 각 사이클 실측 결과는 `000N-*.md`에 남긴다.

```text
① 외부 실제 프로젝트 clone (서버·의존성 미실행)
② Beacon tarball을 별도 runner에 설치 → 대상 폴더만 관찰
③ 원본 README·ADR·test·Git log ↔ Beacon 결과 대조
④ 오탐·과대평가·누락 기록 → 개선 계약 N개 도출
⑤ 계약을 scanner / health / timeline 코드에 반영
⑥ 동일 대상 재측정 → before/after 표
⑦ docs/evaluations/000N-*.md 발행 + 필요 시 docs/releases/vX.Y.md
```

핵심 원칙: **평가는 대상 폴더를 읽기만 하고, 판정의 근거·출처·다음 행동을 항상 함께 남긴다.** 점수만 올리는 변경은 목적이 아니다.
