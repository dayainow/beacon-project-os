# Beacon Architecture

## 핵심 경계

```text
사용자 프로젝트 폴더
  ├─ 원본: 코드, 문서, Git, .beacon/project.json, .beacon/journey.json
  └─ 파생: .beacon/cache, .beacon/beacon.db
             ↓
        @beacon/core
             ↓
   @beacon/runtime ← @beacon/cli
             ↓
       @beacon/dashboard
```

- `@beacon/core`: Project Identity, Project Journey, 파일·Git 관찰, Project Health와 Project Book 생성 계약. UI와 HTTP 출력을 모른다.
- `@beacon/runtime`: 현재 프로젝트 하나를 읽어 localhost API로 제공한다.
- `@beacon/cli`: `init`, `cycle`, `open`, `identity`, `export`의 사용자 진입점이다.
- `@beacon/dashboard`: runtime이 제공한 관찰 결과만 표시한다.

Dashboard는 별도 프론트엔드 라우터 의존성 없이 `#overview`, `#process`, `#artifacts`, `#history` hash를 사용한다. 네 화면은 동일한 API 응답을 공유하며 화면 이동만으로 재스캔하지 않는다. 넓은 화면에서는 고정된 왼쪽 내비게이션, 좁은 화면에서는 상단 가로 내비게이션을 사용한다.

## 데이터 소유권

| 데이터 | 위치 | 성격 |
|---|---|---|
| 프로젝트 코드·문서·Git | 사용자 프로젝트 폴더 | 원본 |
| Beacon 설정 | `.beacon/project.json` | 원본, 버전 관리 가능 |
| Journey와 Cycle 의도 | `.beacon/journey.json` | 원본, 버전 관리 가능 |
| 로컬 DB·검색 인덱스 | `.beacon/` 내부 | 파생, 재생성 가능 |
| Process Template | `templates/default` | 제품 기본값 |

Dashboard는 별도 Operations DB나 Project ID 입력을 요구하지 않는다. CLI가 실행된 폴더가 유일한 프로젝트 경계다.

## 관찰 흐름

```text
filesystem + git
  → scanProject(root)
  → ProjectObservation
  ├─ evaluateProjectHealth(observation)
  ├─ assessProjectProcess(observation)
  └─ buildProjectTimeline(observation)
  → ProjectHistoryStore.record(snapshot)
  → .beacon/beacon.db
  → GET /api/snapshot + GET /api/history
  → Dashboard
```

파일 스캐너는 심볼릭 링크를 따라가지 않고 `.git`, `.beacon`, 의존성, cache와 build 결과를 제외한다. 한 번에 최대 10,000개 파일을 관찰하며 제한을 넘으면 `truncated`로 설명한다. Git 명령은 shell 없이 현재 프로젝트 경로에만 실행하고 3초 제한을 둔다.

문서 산출물은 `project`와 `support` 범위로 나눈다. 일반 프로젝트 문서와 `docs/adr`는 `project`, 루트의 `skills`, `.agents`, `.claude`, `.cursor`, `.github` 아래 문서는 `support`다. 지원 문서도 관찰 결과에 남겨 출처를 잃지 않지만 Health와 P0–P4 Gate의 충족 근거, 핵심 Timeline 연결에는 사용하지 않는다. 파일명 분류는 토큰 경계를 사용하며 `PRODUCT.md`는 기획이지만 도메인 소스 설명인 `product-pdp.md`는 기획으로 간주하지 않는다.

Project Health는 소개, 기획, 설계, Git 저장소와 commit 이력의 다섯 기준을 점검한다. 점수만 표시하지 않고 각 신호에 근거, 출처와 다음 행동을 포함한다. 미커밋 변경은 실패가 아니라 검토가 필요한 진행 상태로 취급한다.

P0–P4 Process Assessment는 파일·Git 관찰 결과를 기본 Template의 요구조건에 연결한다. P0는 개요·기획, P1은 설계, P2는 소스·commit, P3는 테스트 패턴 또는 검증 문서, P4는 릴리스 문서를 사용한다. 첫 번째 `needs_evidence` 단계를 현재 단계로 표시하지만 자동으로 Gate를 승인하거나 프로젝트 단계를 변경하지 않는다.

Project Timeline은 최근 Git commit 최대 20개의 변경 경로와 아직 commit되지 않은 문서 변경을 결합한다. 깨끗한 Git 문서는 파일 수정 시각으로 중복 표시하지 않고 해당 문서를 변경한 최근 commit에 연결한다. Git이 없는 프로젝트에서만 파일 수정 시각을 대체 근거로 사용한다. 문서는 종류를, commit은 Conventional Commit type을 사용해 의미 범주를 부여한다. 원본에 없는 의미를 AI로 추측하지 않으며 분류할 수 없는 변경은 `change`로 유지한다. 최신 30개 이벤트를 반환하고 `total`과 `truncated`로 관찰 범위를 설명한다.

일반 commit 제목은 선두 동사와 명시적인 단어만 보수적으로 사용한다. 예를 들어 `Fix`는 문제 해결, `Document`와 README 갱신은 문서, `Migrate`는 구현, CODEOWNERS·Dockerfile은 운영으로 분류한다. 근거가 불충분하면 계속 `change`로 둔다.

## Append-only History

Runtime은 Node 22.13 이상에서 제공되는 `node:sqlite`를 사용해 별도 네이티브 패키지 없이 프로젝트 전용 DB를 연다. 저장 파일은 `.beacon/beacon.db`이며 `beacon.db*` 패턴으로 WAL 부속 파일까지 Git에서 제외한다.

| 테이블 | 책임 |
|---|---|
| `project_snapshots` | 변경된 관찰 상태의 전체 JSON과 fingerprint |
| `project_changes` | 직전 기준선과 비교한 산출물 추가·변경·삭제 및 새 commit |
| `timeline_events` | 출처와 발생 시각으로 중복 제거된 누적 Timeline |

History Store는 마지막 Snapshot의 fingerprint와 현재 관찰을 비교한다. 같으면 저장을 건너뛰고, 다르면 트랜잭션 안에서 Snapshot, 변화 이벤트와 Timeline 이벤트를 삽입한다. fingerprint는 전체 이력에서 유일하지 않으므로 `A → B → A` 복귀도 새 변화로 보존된다. Runtime 코드에는 저장된 행을 갱신하거나 삭제하는 경로를 두지 않는다.

`init`은 버전 있는 설정을 만들고, `open`은 loopback runtime을 시작한다. Dashboard는 `GET /api/identity`, `GET /api/journey`, `GET /api/snapshot`, `GET /api/history`만 사용하므로 Operations DB나 별도 Project ID가 필요 없다. Project Book export도 같은 프로젝트 경계를 유지한다.

## Project Journey

```text
beacon cycle start "이름" --goal "목표"
  → scanProject(root)
  → ProjectHistoryStore.record(snapshot)
  → 시작 Snapshot ID + Git HEAD + 핵심 산출물 경로
  → .beacon/journey.json
  → GET /api/journey
  → Dashboard 현재 Cycle
```

Cycle 이름과 목표는 파일·Git으로 유도할 수 없는 사용자 의도이므로 파생 DB가 아니라 `.beacon/journey.json`에 둔다. 이 파일은 `.beacon/project.json`처럼 프로젝트가 소유하고 버전 관리할 수 있다. 반면 시작 기준선이 가리키는 Snapshot 본문과 이후 변화는 기존 append-only SQLite에 보존한다. 한 프로젝트에는 한 번에 하나의 `active` Cycle만 허용하며 순번은 기존 Cycle의 최대 순번 다음 값으로 정한다.

스캐너는 `.beacon/`을 파일 발견과 Git 작업 변경에서 제외한다. 따라서 Beacon의 설정·Journey 변경이 프로젝트 Health나 산출물 변화로 자기 참조되지 않는다. `journey.json` 쓰기는 임시 파일을 같은 디렉터리에 쓴 뒤 rename해 중간 상태를 노출하지 않는다.

## Project Book Export

```text
readProjectIdentity(root) + scanProject(root)
  → ProjectHistoryStore.record(snapshot)
  → ProjectHistoryStore.history(200)
  → generateProjectBook(identity, snapshot, history)
  → PROJECT_BOOK.md
```

`generateProjectBook`은 `@beacon/core`의 순수 Markdown 생성기이며 로컬 파일을 직접 쓰지 않는다. CLI가 초기화 여부 확인, 최신 스캔 저장, 출력 위치 해석과 파일 쓰기를 담당한다. 기본 출력은 프로젝트 루트지만 `--output` 상대 경로는 항상 해당 프로젝트 루트를 기준으로 해석한다. 파일·Git 스캐너는 `PROJECT_BOOK.md`를 Beacon 파생 산출물로 제외해 반복 내보내기가 자체 변경 이력을 만들지 않는다. 공유 시 로컬 환경 정보가 새지 않도록 Project Identity의 절대 `root`는 문서에 출력하지 않는다.

## 배포 경계

```text
@beacon/core + @beacon/dashboard + @beacon/runtime + packages/cli
  → esbuild Node ESM bundle
  → @dayainow/beacon/dist/index.js
  → dayainow-beacon-<version>.tgz
```

저장소 내부 경계는 개발과 테스트를 위해 유지하지만 배포 CLI는 비공개 workspace 패키지를 모두 포함한 단일 실행 파일이다. 설치 후에는 별도 Beacon runtime dependency가 없으며 Node.js 22.13 이상의 내장 `node:sqlite`만 사용한다. 패키지 인수 검증은 임시 소비자와 프로젝트를 만들고 tarball을 오프라인 설치한 뒤 `init`, `identity`, `open`, Snapshot API, Dashboard와 `export`를 실행한다.
