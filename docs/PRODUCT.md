# Beacon Product

| 항목 | 내용 |
|---|---|
| 상태 | MVP v0.2.0 |
| 제품명 | Beacon |
| 저장소 | `dayainow/beacon-project-os` |
| 기준일 | 2026-07-15 |

> Beacon은 프로젝트 폴더에서 시작해 현재 방향, 부족한 부분, 산출물과 변경 이력을 보여주는 로컬 우선 Project Navigation OS다.

## 적용 대상

Beacon은 **하나의 제품·서비스를 처음부터 완성까지 만들어 가는 프로젝트**에 맞다(P0 기획 → P1 설계 → P2 개발 → P3 검증 → P4 배포). 기획·설계 문서를 쓰는 팀의 개발 저장소가 대상이다.

범용 라이브러리·프레임워크처럼 기획·설계 문서 없이 코드·README 중심으로 가는 저장소는 대상이 아니며, 그 경우 Health가 낮게 나오는 것은 결함이 아니라 "대상이 아님"의 정직한 신호다. P0–P4는 고정 표준이며 팀별로 바꾸지 않는다([ADR 0003](adr/0003-fixed-p0-p4-product-projects.md)).

## 해결할 문제

프로젝트의 문서, 코드, Git 이력과 의사결정이 여러 도구에 흩어져 팀이 현재 상태와 빠진 부분을 한눈에 확인하기 어렵다. 증거와 산출물을 운영 도구에 매번 다시 등록하는 방식은 실제 프로젝트와 관리 화면을 쉽게 어긋나게 한다.

Beacon은 실제 프로젝트 폴더를 프로젝트 그 자체로 취급한다. 자동으로 발견할 수 있는 정보는 파일과 Git에서 읽고, 부족한 항목에는 근거와 다음 행동을 붙인다. 프로젝트 종료 시에는 과정, 변경, 문제와 산출물을 Project Book으로 남긴다.

## 구현된 세로 흐름

### 1. Project Identity

```text
임의의 프로젝트 폴더
→ beacon init
→ beacon open
→ 현재 폴더의 Project Identity 표시
```

### 인수 조건

- 별도 프로젝트 폴더에서 2분 안에 초기화하고 화면을 열 수 있다.
- 화면은 고정 샘플이 아니라 현재 폴더 이름을 표시한다.
- Git 저장소라면 현재 branch와 commit을 표시한다.
- Goodz checkout이나 Commerce Reference가 없어도 동작한다.

### 2. Project Observation

```text
현재 프로젝트 폴더
→ 파일·Git 자동 스캔
→ 산출물과 최근 변경 표시
→ 부족한 기준과 다음 행동 설명
```

#### 인수 조건

- `.git`, `.beacon`, 의존성과 빌드 산출물을 제외하고 프로젝트 파일을 읽는다.
- README, 기획, 설계, 검증과 릴리스 문서를 경로와 함께 자동 분류한다.
- 핵심 프로젝트 산출물과 AI skill·GitHub 설정 같은 지원 문서를 구분한다.
- 지원 문서는 발견 목록에는 유지하지만 Project Health와 Gate 근거로 사용하지 않는다.
- 최근 Git commit과 아직 commit되지 않은 경로를 표시한다.
- 소개·기획·설계·Git·변경 이력의 기본 기준을 점검한다.
- 모든 신호는 근거, 출처와 다음 행동을 포함한다.
- 다시 스캔하면 현재 폴더 상태가 화면에 반영된다.

### 3. Project Timeline

```text
작업 중 문서 + Git commit의 변경 경로
→ 기획·설계·기능·문제 해결·검증·릴리스 범주화
→ 출처를 유지한 단일 시간순 Timeline
```

#### 인수 조건

- Git commit의 변경 경로와 아직 commit되지 않은 문서 변경을 하나의 시간순 목록으로 합친다.
- 문서 종류와 Conventional Commit type을 기준으로 의미 범주를 설명한다.
- Conventional Commit이 아닌 일반적인 Fix·Document·Migrate 형태도 보수적으로 의미 범주를 설명한다.
- 각 이벤트는 파일 경로 또는 commit hash를 출처로 유지한다.
- commit에 발견한 산출물이 포함되면 해당 문서 경로를 commit 이벤트에 연결한다.
- Git이 없는 프로젝트에서만 파일 수정 시각을 Timeline의 대체 근거로 사용한다.
- 최근 이벤트가 먼저 나타나며 동일 시각에도 결과 순서가 안정적이다.
- 최대 30개를 표시하고 더 많은 이벤트가 있으면 전체 개수와 잘림 여부를 제공한다.
- 범주를 추측하기 어려운 commit은 숨기지 않고 `변경`으로 표시한다.

### 4. Persistent History

```text
현재 Snapshot
→ 직전 저장 기준선과 비교
→ 산출물 추가·변경·삭제와 새 commit 감지
→ 프로젝트 전용 SQLite에 append-only 저장
```

#### 인수 조건

- 첫 스캔은 변화 이벤트를 만들지 않고 기준선으로 저장한다.
- 직전 기준선과 같은 상태를 다시 스캔하면 중복 Snapshot을 만들지 않는다.
- 상태가 `A → B → A`로 되돌아와도 마지막 상태와 다르면 새 기준선으로 남긴다.
- 산출물 추가·변경·삭제와 새 Git commit을 구조화된 변화 이벤트로 저장한다.
- Timeline 이벤트는 고유 출처와 시각으로 중복을 제거해 누적한다.
- SQLite와 WAL 파일은 `.beacon/` 안에 두고 Git 추적에서 자동 제외한다.
- Dashboard에서 저장된 기준선 수, 누적 Timeline과 스캔 사이의 변화를 확인할 수 있다.

### 5. P0–P4 Gate Readiness

```text
발견한 문서·소스·테스트·Git 이력
→ P0 기획 · P1 디자인 · P2 개발 · P3 검증 · P4 배포에 연결
→ 첫 번째 증거 부족 Gate와 다음 행동 표시
```

#### 인수 조건

- P0는 루트 README와 기획 문서를 확인한다.
- P1은 Architecture, Design 또는 ADR 산출물을 확인한다.
- P2는 구현 소스와 Git commit 이력을 확인한다.
- P3는 테스트 코드 또는 검증 문서를 확인한다.
- P4는 CHANGELOG 또는 릴리스 문서를 확인한다.
- 첫 번째 증거 부족 단계를 현재 단계로 표시하고 이후 단계는 후속 단계로 둔다.
- 각 요구조건은 충족 여부, 근거, 출처와 다음 행동을 제공한다.
- 자동 관찰은 Gate 준비도만 설명하며 GO·HOLD·KILL 결정이나 승인을 대신하지 않는다.

### 6. Project Book Export

```text
Project Identity + 현재 Snapshot + append-only History
→ beacon export
→ 프로젝트 과정과 현재 상태를 설명하는 PROJECT_BOOK.md
```

#### 인수 조건

- 내보내기 직전에 현재 프로젝트를 스캔하고 변경된 기준선을 History에 저장한다.
- 프로젝트 정체성, 현재 Health, P0–P4 Gate 준비도와 부족한 요구조건을 포함한다.
- 발견한 산출물, 스캔 사이의 변화와 누적 Timeline을 출처와 함께 포함한다.
- 기본 출력은 프로젝트 루트의 `PROJECT_BOOK.md`이며 `--output`으로 위치를 바꿀 수 있다.
- 생성된 `PROJECT_BOOK.md`는 다음 자동 관찰에서 제외해 내보내기 자체가 변화 이력을 만들지 않는다.
- 공유 가능한 문서에 사용자 컴퓨터의 프로젝트 절대 경로를 포함하지 않는다.
- 자동 생성 문서임과 사람의 Gate 승인을 대신하지 않음을 명시한다.

### 7. Project Journey — Cycle Start

```text
프로젝트 시작 시점
→ Cycle 이름과 목표 기록
→ 현재 Snapshot을 시작 기준선으로 고정
→ Dashboard에서 현재 Cycle과 시작 상태 표시
```

#### Cycle 정의 — 마일스톤 단위

**하나의 Cycle은 "완결되는 목표 하나(마일스톤)"다.** 스프린트처럼 정해진 기간으로 끊지 않고, 목표가 손에 잡히는 결과물로 완결될 때까지를 한 Cycle로 본다.

- **시작:** 새 목표에 착수할 때 `beacon cycle start "이름" --goal "이번에 완성할 것"`.
- **종료:** 그 목표의 결과물이 나왔을 때 `beacon cycle complete --summary "무엇을 이뤘나"`. 시작 기준선과 비교한 성과(산출물·commit·Health·Gate 변화)가 자동으로 남는다.
- **크기 기준:** 며칠~2주 안에 "됐다"고 말할 수 있는 크기. 너무 크면(몇 달) 여러 Cycle로 쪼개고, 너무 작으면(단일 commit) 합친다.
- **계층:** Cycle(=마일스톤/에픽)만 사람이 정의한다. 그 아래 개별 변경(이슈·태스크)은 Git commit과 파일 변화로 Timeline·History에 자동으로 채워지므로 수동 입력하지 않는다.

예: `"B2C 대출 기능 MVP"`는 여러 파일·commit이 모여 하나로 완결되는 좋은 Cycle이다. `"버튼 색 변경"`은 너무 작고(그냥 commit), `"서비스 전체 개발"`은 너무 크다(여러 Cycle).

#### 인수 조건

- `beacon cycle start "이름" --goal "목표"`로 하나의 진행 중 Cycle을 시작한다.
- Cycle은 순번, 이름, 목표, 시작 시각과 상태를 가진다.
- 시작 순간의 Snapshot ID, Git HEAD와 핵심 산출물 경로를 기준선으로 보존한다.
- 진행 중 Cycle이 있으면 새 Cycle 시작을 막고 기존 Cycle 이름을 알려준다.
- 사용자가 정한 Cycle 의도는 `.beacon/journey.json`에 버전 관리 가능한 원본으로 저장한다.
- Dashboard는 현재 Cycle과 목표, 시작 기준선을 자동 관찰 결과보다 먼저 보여준다.
- 첫 세로 흐름은 Cycle 시작과 조회까지만 포함하며, 종료 요약과 Cycle별 Project Book은 다음 흐름에서 추가한다.

### 8. Dashboard Navigation

```text
긴 단일 페이지
→ 개요 · 단계 · 산출물 · 히스토리 분리
→ 왼쪽 내비게이션과 URL hash로 즉시 전환
```

#### 인수 조건

- 개요는 Project Identity, 현재 Cycle, 핵심 지표와 다음 행동만 보여준다.
- 단계는 P0–P4와 현재 Gate 근거를 보여준다.
- 산출물은 발견한 핵심 산출물 전체를 보여준다.
- 히스토리는 누적 Timeline과 스캔 사이 변화를 보여준다.
- 화면 전환은 데이터를 다시 스캔하지 않고 즉시 이루어진다.
- 현재 화면은 URL hash에 남아 새로고침과 링크 공유 후에도 유지된다.
- 좁은 화면에서는 왼쪽 내비게이션을 상단 가로 메뉴로 바꾼다.

## MVP

- 단일 로컬 프로젝트 폴더
- Project Identity
- P0–P4 Process Run과 Gate
- 로컬 파일·Git 스캐너
- 출처가 있는 산출물 목록
- 설명 가능한 Project Health 신호
- 의미 단위 Timeline
- 프로젝트 전용 SQLite
- 프로젝트 Journey와 현재 Cycle 시작 기준선
- 최대 5개의 기본 메뉴: 개요, 단계, 산출물, 히스토리, 설정
- 프로젝트에 설치 가능한 단일 CLI tarball과 clean-room 인수 검증

## 비목표

- 여러 프로젝트 Portfolio와 조직 관리
- 계정, RBAC, Cloud 동기화
- Commerce 등 도메인 Reference 번들
- Template Builder
- 자동 branch, push, Pull Request
- AI의 Gate 자동 승인
- 기존 Goodz Dashboard 전체 이식

## 제품 원칙

1. 프로젝트 폴더가 원본을 소유한다.
2. `.beacon/` 파생 인덱스는 삭제 후 재생성할 수 있어야 한다.
3. 자동 발견을 기본으로 하고 수동 입력은 수정과 예외 처리로 제한한다.
4. 모든 건강 신호는 근거, 출처와 다음 행동을 제공한다.
5. 새 계약과 테스트를 먼저 작성하고 필요한 기존 코드만 선별 이식한다.
