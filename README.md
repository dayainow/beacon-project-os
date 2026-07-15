# Beacon

Beacon은 프로젝트 폴더에서 시작해 현재 방향, 부족한 부분, 산출물과 변경 이력을 보여주는 로컬 우선 Project Navigation OS입니다.

현재 저장소는 `beacon init → beacon open → project identity → file·Git scan → Beacon signals → Project Timeline → append-only history` 세로 흐름을 구현합니다.

## 시작하기

```bash
pnpm install
pnpm verify
pnpm --filter @beacon/cli start -- init --root ./fixtures/sample-project
pnpm --filter @beacon/cli start -- open --root ./fixtures/sample-project
```

브라우저에서 로컬 Dashboard가 열리고, 샘플 데이터가 아니라 지정한 프로젝트 폴더의 이름, 발견한 문서 산출물, 부족한 기준과 통합 Timeline을 표시합니다. 스캔 기준선과 변화는 프로젝트의 `.beacon/beacon.db`에 누적되며, 모든 보완 신호에는 근거·출처·다음 행동이 포함됩니다.

## 저장소 구조

```text
apps/dashboard          프로젝트의 현재 상태를 보여주는 로컬 UI
packages/core           Project Identity와 설정 계약
packages/runtime        로컬 HTTP runtime
packages/cli            init·open·identity 명령
templates/default       최소 P0–P4 프로세스 템플릿
fixtures/sample-project 외부 프로젝트 검증용 fixture
docs                    제품·아키텍처·출처 기록
```

제품 범위는 [PRODUCT](./docs/PRODUCT.md), 경계와 데이터 소유권은 [ARCHITECTURE](./docs/ARCHITECTURE.md)를 확인하세요.
