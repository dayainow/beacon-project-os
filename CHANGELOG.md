# Changelog

## Unreleased

### Added

- `beacon cycle start`와 `beacon cycle status` Project Journey 명령
- Cycle 시작 시 Snapshot, Git HEAD와 핵심 산출물을 묶는 기준선
- Dashboard의 현재 Cycle, 목표와 시작 기준선 표시
- 로컬 Runtime의 `GET /api/journey`

### Changed

- `.beacon/` 내부 사용자 의도와 파생 파일이 프로젝트 Git 관찰을 오염하지 않도록 제외

## 0.2.0 — 2026-07-15

실제 외부 쇼핑몰 저장소 `saleor/storefront` 대조 평가를 바탕으로 관찰 정확도와 Dashboard 설명력을 높였습니다.

### Added

- 핵심 프로젝트 산출물과 AI skill·저장소 지원 문서 범위 구분
- Dashboard의 핵심 산출물·지원 문서 분리 표시
- 일반적인 Fix·Document·Migrate commit 제목의 Timeline 의미 분류
- Saleor Storefront 외부 평가 기록과 회귀 테스트

### Changed

- 지원 문서는 Health와 P0–P4 Gate 근거에서 제외
- `product-pdp.md` 같은 도메인 기능 문서를 PRD로 오인하지 않도록 파일명 토큰 분류 개선
- Health 기준이 하나라도 부족하면 `on_track` 대신 `attention`으로 표시
- Project Book에 핵심·지원 범위를 함께 기록

## 0.1.0 — 2026-07-15

Beacon의 첫 설치 가능한 로컬 MVP입니다.

### Added

- 프로젝트 폴더 기반 `init`, `open`, `identity`, `export` CLI
- 파일·Git 자동 관찰과 근거가 있는 Project Health 신호
- P0–P4 Gate 준비도와 다음 행동
- commit과 문서 변경을 결합한 Project Timeline
- 프로젝트 전용 SQLite append-only History
- 정체성, Gate, 산출물, 변화와 Timeline을 합친 Project Book
- 내부 워크스페이스를 포함한 단일 실행 파일 패키지
- 배포 tarball의 clean-room 설치·실행 인수 검증

### Constraints

- 단일 로컬 프로젝트만 지원
- Node.js 22.13 이상 필요
- 계정, Cloud 동기화, Portfolio와 자동 Gate 승인은 지원하지 않음
