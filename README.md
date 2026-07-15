# Beacon

Beacon은 프로젝트 폴더를 읽어 현재 방향, 부족한 근거, 산출물과 변경 이력을 보여주는 로컬 우선 Project Navigation OS입니다.

별도의 운영 DB에 증거를 다시 등록하지 않습니다. 프로젝트의 파일과 Git을 자동으로 관찰하고, P0–P4 Gate 준비도와 다음 행동을 설명하며, 전체 과정을 `PROJECT_BOOK.md`로 남깁니다.

## 현재 릴리스

- 버전: `v0.2.0`
- 범위: 단일 로컬 프로젝트
- 요구사항: Node.js `22.13` 이상, pnpm
- 데이터: 프로젝트의 `.beacon/`에만 저장

## 프로젝트에 설치하기

프로젝트 루트에서 GitHub Release 패키지를 개발 의존성으로 설치합니다.

```bash
pnpm add --save-dev https://github.com/dayainow/beacon-project-os/releases/download/v0.2.0/dayainow-beacon-0.2.0.tgz
pnpm exec beacon init
pnpm exec beacon open
```

브라우저에 로컬 Dashboard가 열립니다. `개요 · 단계 · 산출물 · 히스토리` 화면에서 현재 폴더의 이름과 Git 상태, 발견한 문서, Beacon 신호, P0–P4 Gate 준비도, Timeline과 누적 변경 이력을 확인할 수 있습니다.

전역 명령으로 사용하려면 같은 릴리스 파일을 `pnpm add --global`로 설치할 수 있습니다.

## 기본 흐름

```text
프로젝트 폴더
→ beacon init
→ beacon cycle start "1차 MVP" --goal "이번 Cycle의 결과"
→ beacon open
→ 파일·Git 자동 관찰
→ 부족한 근거와 다음 행동 확인
→ beacon export
→ PROJECT_BOOK.md
```

| 명령 | 역할 |
|---|---|
| `beacon init` | 현재 프로젝트에 `.beacon/project.json`을 만들고 Beacon을 초기화합니다. |
| `beacon open` | `127.0.0.1:4300`에서 로컬 Dashboard를 엽니다. |
| `beacon identity` | 현재 프로젝트의 이름, 경로와 Git 기준점을 확인합니다. |
| `beacon cycle start "이름" --goal "목표"` | 현재 상태를 기준선으로 저장하고 새 Project Cycle을 시작합니다. |
| `beacon cycle status` | 현재 Cycle을 포함한 Project Journey를 확인합니다. |
| `beacon export` | 현재 Snapshot과 누적 History로 `PROJECT_BOOK.md`를 만듭니다. |

모든 명령은 현재 폴더를 기본 프로젝트로 사용하며 `--root PATH`로 다른 폴더를 지정할 수 있습니다. `open`은 `--port PORT`, `--no-browser`를 지원하고 `export`는 `--output PATH`로 출력 위치를 바꿀 수 있습니다.

## Beacon이 보여주는 것

- 파일·Git에서 자동으로 발견한 기획, 설계, 검증, 릴리스 산출물
- 근거·출처·다음 행동이 함께 있는 Project Health 신호
- P0 기획, P1 디자인, P2 개발, P3 검증, P4 배포 Gate 준비도
- commit과 작업 중 문서를 의미 단위로 묶은 Project Timeline
- SQLite에 append-only로 쌓이는 Snapshot과 변경 이력
- Cycle의 이름·목표와 시작 당시 Snapshot·Git·산출물 기준선
- 정체성, Gate, 산출물, 변화와 Timeline을 합친 Project Book

Beacon은 준비된 근거를 설명하지만 GO·HOLD·KILL 결정이나 사람의 승인을 대신하지 않습니다. 계정, Cloud 동기화, 여러 프로젝트 Portfolio도 `v0.2.0` 범위에 포함하지 않습니다.

## 데이터와 개인정보

프로젝트 파일은 외부 서버로 전송되지 않습니다. 원본은 현재 프로젝트 폴더가 소유하고 Beacon의 재생성 가능한 DB는 `.beacon/beacon.db`에 저장됩니다. 생성한 Project Book에는 사용자 컴퓨터의 절대 프로젝트 경로를 넣지 않습니다.

## 저장소에서 개발하기

```bash
pnpm install
pnpm verify
pnpm --filter @dayainow/beacon start -- init --root ./fixtures/sample-project
pnpm --filter @dayainow/beacon start -- open --root ./fixtures/sample-project
pnpm --filter @dayainow/beacon start -- export --root ./fixtures/sample-project
```

`pnpm verify`는 빌드, 타입 검사, 테스트와 배포 tarball의 clean-room 설치 검증을 모두 실행합니다.

```text
apps/dashboard          프로젝트 현재 상태를 보여주는 로컬 UI
packages/core           Identity·관찰·Process·Project Book 계약
packages/runtime        로컬 HTTP runtime과 SQLite History
packages/cli            설치 가능한 @dayainow/beacon CLI
scripts                 배포 패키지 clean-room 인수 검증
fixtures/sample-project 외부 프로젝트 검증용 fixture
docs                    제품·아키텍처·ADR·릴리스 기록
```

제품 범위는 [PRODUCT](./docs/PRODUCT.md), 경계와 데이터 소유권은 [ARCHITECTURE](./docs/ARCHITECTURE.md), 변경점은 [CHANGELOG](./CHANGELOG.md)를 확인하세요.
