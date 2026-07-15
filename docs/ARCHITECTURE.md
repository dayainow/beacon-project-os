# Beacon Architecture

## 핵심 경계

```text
사용자 프로젝트 폴더
  ├─ 원본: 코드, 문서, Git, .beacon/project.json
  └─ 파생: .beacon/cache, .beacon/beacon.db
             ↓
        @beacon/core
             ↓
   @beacon/runtime ← @beacon/cli
             ↓
       @beacon/dashboard
```

- `@beacon/core`: Project Identity, 파일·Git 관찰과 Project Health 계약. UI와 HTTP를 모른다.
- `@beacon/runtime`: 현재 프로젝트 하나를 읽어 localhost API로 제공한다.
- `@beacon/cli`: `init`, `open`, `identity`의 사용자 진입점이다.
- `@beacon/dashboard`: runtime이 제공한 관찰 결과만 표시한다.

## 데이터 소유권

| 데이터 | 위치 | 성격 |
|---|---|---|
| 프로젝트 코드·문서·Git | 사용자 프로젝트 폴더 | 원본 |
| Beacon 설정 | `.beacon/project.json` | 원본, 버전 관리 가능 |
| 로컬 DB·검색 인덱스 | `.beacon/` 내부 | 파생, 재생성 가능 |
| Process Template | `templates/default` | 제품 기본값 |

Dashboard는 별도 Operations DB나 Project ID 입력을 요구하지 않는다. CLI가 실행된 폴더가 유일한 프로젝트 경계다.

## 관찰 흐름

```text
filesystem + git
  → scanProject(root)
  → ProjectObservation
  ├─ evaluateProjectHealth(observation)
  └─ buildProjectTimeline(observation)
  → ProjectHistoryStore.record(snapshot)
  → .beacon/beacon.db
  → GET /api/snapshot + GET /api/history
  → Dashboard
```

파일 스캐너는 심볼릭 링크를 따라가지 않고 `.git`, `.beacon`, 의존성, cache와 build 결과를 제외한다. 한 번에 최대 10,000개 파일을 관찰하며 제한을 넘으면 `truncated`로 설명한다. Git 명령은 shell 없이 현재 프로젝트 경로에만 실행하고 3초 제한을 둔다.

Project Health는 소개, 기획, 설계, Git 저장소와 commit 이력의 다섯 기준을 점검한다. 점수만 표시하지 않고 각 신호에 근거, 출처와 다음 행동을 포함한다. 미커밋 변경은 실패가 아니라 검토가 필요한 진행 상태로 취급한다.

Project Timeline은 최근 Git commit 최대 20개의 변경 경로와 아직 commit되지 않은 문서 변경을 결합한다. 깨끗한 Git 문서는 파일 수정 시각으로 중복 표시하지 않고 해당 문서를 변경한 최근 commit에 연결한다. Git이 없는 프로젝트에서만 파일 수정 시각을 대체 근거로 사용한다. 문서는 종류를, commit은 Conventional Commit type을 사용해 의미 범주를 부여한다. 원본에 없는 의미를 AI로 추측하지 않으며 분류할 수 없는 변경은 `change`로 유지한다. 최신 30개 이벤트를 반환하고 `total`과 `truncated`로 관찰 범위를 설명한다.

## Append-only History

Runtime은 Node 22.13 이상에서 제공되는 `node:sqlite`를 사용해 별도 네이티브 패키지 없이 프로젝트 전용 DB를 연다. 저장 파일은 `.beacon/beacon.db`이며 `beacon.db*` 패턴으로 WAL 부속 파일까지 Git에서 제외한다.

| 테이블 | 책임 |
|---|---|
| `project_snapshots` | 변경된 관찰 상태의 전체 JSON과 fingerprint |
| `project_changes` | 직전 기준선과 비교한 산출물 추가·변경·삭제 및 새 commit |
| `timeline_events` | 출처와 발생 시각으로 중복 제거된 누적 Timeline |

History Store는 마지막 Snapshot의 fingerprint와 현재 관찰을 비교한다. 같으면 저장을 건너뛰고, 다르면 트랜잭션 안에서 Snapshot, 변화 이벤트와 Timeline 이벤트를 삽입한다. fingerprint는 전체 이력에서 유일하지 않으므로 `A → B → A` 복귀도 새 변화로 보존된다. Runtime 코드에는 저장된 행을 갱신하거나 삭제하는 경로를 두지 않는다.

`init`은 버전 있는 설정을 만들고, `open`은 loopback runtime을 시작한다. Dashboard는 `GET /api/identity`, `GET /api/snapshot`, `GET /api/history`만 사용하므로 Operations DB나 별도 Project ID가 필요 없다. Project Book export는 이 경계를 유지한 채 이후 세로 흐름으로 추가한다.
