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

- `@beacon/core`: Project Identity와 설정 계약. UI와 HTTP를 모른다.
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

## 첫 기준선

현재 구현은 의도적으로 작다. `init`이 버전 있는 설정을 만들고, `open`이 loopback runtime을 시작하며, Dashboard가 `GET /api/identity`를 통해 현재 폴더 이름과 Git 상태를 보여준다. 파일 스캐너, Health, Timeline과 SQLite는 이 경계를 유지한 채 세로 흐름으로 추가한다.

