# ADR 0001 — Goodz 출처와 선별 이식

| 항목 | 내용 |
|---|---|
| 상태 | Accepted |
| 결정일 | 2026-07-15 |
| 원본 | [dayainow/goodz](https://github.com/dayainow/goodz) |
| 기준선 | `v1.1.0` (`c3dece7`) |

## 결정

Beacon은 Goodz Git history를 가져오지 않고 독립 저장소와 새 이력에서 시작한다. Goodz가 검증한 P0–P4, Gate, Project Identity, 로컬 설정과 clean-clone 테스트의 개념은 유지하되 새 제품의 계약과 인수 테스트를 먼저 작성한다.

초기 기준선은 Goodz 파일을 직접 복사하지 않았다. `@beacon/core`, `@beacon/runtime`, `@beacon/cli`와 Dashboard는 `beacon init → beacon open → project identity`에 필요한 최소 코드로 새로 작성했다. 이후 코드를 선별 이식할 때에는 이 문서에 원본 경로, 기준 commit, 변경 이유를 추가한다.

## 제외

- Commerce 앱과 타입
- Goodz 자체 운영 데이터와 Internal Reference
- 기존 Process Dashboard 전체
- Template Builder, Workbench, DORA와 Incident 기능
- 자동 Git push와 Pull Request 기능

## 결과

Beacon의 초기 복잡도는 단일 프로젝트 폴더와 하나의 세로 흐름으로 제한된다. 원본 프로젝트와 `.beacon/` 파생 데이터의 경계가 제품 기능보다 먼저 고정된다.

