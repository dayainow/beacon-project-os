# Changelog

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
