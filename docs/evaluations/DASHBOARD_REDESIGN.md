# Beacon Dashboard 전면 개편 계획

| 항목 | 내용 |
|---|---|
| 작성일 | 2026-07-21 |
| 상태 | 계획 확정 — 단계별 구현 |
| 레퍼런스 | Panze 스타일 Project Management SaaS Dashboard (Dribbble 27013793) |
| 방침 | **비주얼 언어만 차용, 콘텐츠는 Beacon 실제 데이터** |

## 원칙 (먼저 못 박기)

레퍼런스는 범용 PM SaaS라 매출·미팅·티켓·담당자 데이터가 있지만 **Beacon엔 없다**. Beacon의 진실은 파일·Git뿐(`identity/snapshot/journey/history` API). 없는 데이터를 지어내는 것은 제품 철학("프로젝트 폴더가 원본을 소유")에 어긋난다.

**그래서: 레이아웃·카드·차트 스타일·색감만 가져오고, 모든 콘텐츠는 실제 데이터로 채운다. 가짜 데이터 없음.**

## 레퍼런스 → Beacon 매핑

| 레퍼런스 요소 | Beacon 적용 | 데이터 |
|---|---|---|
| 떠 있는 카드 그리드, 큰 라운드, 부드러운 그림자 | 전체 비주얼 톤 | — |
| 도넛 차트 (In Progress/Completed/Not Started) | **P0~P4 단계 준비도** 도넛 | journey/snapshot |
| 진행 바 (Invoice Overview) | **Health 5개 기준** 컬러 바 | snapshot.health |
| 영역 그래프 (Income vs Expense) | **일자별 활동량** 영역/스파크라인 | history.timeline |
| 상단 필터 pill (Today/This Week/Month) | 히스토리 기간 필터 | — |
| My Tasks 리스트 | **먼저 챙길 것**(시그널) 재활용 | snapshot.health.signals |
| 상단 검색바 | (보류 — 검색 기능 없음) | ❌ |
| Income/Invoice/Meetings/Tickets/아바타 | **제외** (없는 데이터) | ❌ |

## 디자인 시스템 (dataviz 스킬 기반)

- **차트 색**: 상태 팔레트(Health/단계 상태) + 카테고리 팔레트(Timeline category). `validate_palette.js`로 CVD 검증 후 확정.
- **표면**: 라이트 회색 배경(#eef0f3) 위 순백 카드. **레퍼런스가 깔끔한 라이트라 라이트 전용으로 간다(다크 모드 없음).**
- **마크 스펙**: 얇은 마크, 4px 라운드 데이터-엔드, 도넛 세그먼트 2px 간격, 호버 툴팁.

## 구현 단계 (각 단계 = 1 PR, 되돌리기 쉽게)

### 1단계 — 비주얼 셸 (레이아웃·톤) — ✅ 완료 (2026-07-21)
- 디자인 토큰 도입(`--bg`·`--surface`·`--card-radius: 24px`·`--card-shadow`). 밝은 회색 배경 위 순백 카드, 은은한 그림자.
- 사이드바 borderless + 떠 있는 nav, 헤더 타이포 조정. **라이트 전용**(레퍼런스가 깔끔한 라이트).

### 2단계 — 개요 화면 차트화 — ✅ 완료 (2026-07-21)
- 단계 준비도 → SVG 도넛(완료/진행중/대기), Health 5개 → 컬러 바, 일자별 활동 → 영역 그래프.
- 팔레트 CVD 검증 통과(worst ΔE 29.3). `innerHTML` 없이 `createElementNS`로 SVG 생성. 실 데이터로 렌더 확인.

### 3단계 — 나머지 화면 정합 (다음)
- 단계·산출물·히스토리·가이드의 세부 색·간격을 레퍼런스 라이트 톤에 맞춰 정리해 새 셸과 통일.

### 4단계 — 반응형·차트 호버·접근성 마무리
- 차트 호버 툴팁, 모바일 그리드 점검, 포커스·대비 점검.

## 검증 기준 (매 단계)

- 전체 test 8/8, lint 7/7 green 유지.
- 대시보드는 `innerHTML` 없이 기존 `text()` DOM 헬퍼만 사용(안전성 계약).
- **가짜 데이터 0** — 모든 표시는 실제 API 응답에서 나온다.
- 차트 팔레트는 `validate_palette.js` 통과.
- 라이브 서버 + 실 데이터로 각 화면 확인.
