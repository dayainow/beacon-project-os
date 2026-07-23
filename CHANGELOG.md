# Changelog

## 0.3.0 — 2026-07-23

대시보드를 실무 수준으로 재디자인하고, 실제 팀 저장소에서 신뢰할 수 있도록 판정 안정성·데이터 정확성·견고성을 강화했습니다.

### Added

- `beacon cycle complete`로 마일스톤 종료와 시작 대비 성과 요약
- 대시보드 전면 재디자인: 라이트 톤 카드 레이아웃, 디자인 토큰, 고급 폰트 스택
- 개요의 진행 단계 도넛·Health 바·활동량 그래프
- 산출물 종류별 그룹화와 단계(P0–P4) 근거 표시, 텍스트 문서 인라인 뷰어
- 히스토리 일자별 타임라인 피드, Cycle의 에픽–이슈–태스크 트리, commit 작성자 표시
- 단계 카드 클릭으로 단계별 상세 보기, 대시보드 내장 사용 가이드
- GitHub Actions CI(빌드·린트·테스트·패키지 검증), 로컬 Runtime의 `GET /api/file`(안전한 문서 읽기)

### Changed

- `.gitignore`를 존중해 무시 파일·폴더를 스캔에서 제외
- commit 관찰 범위 확대(20 → 500)로 판정이 시점에 흔들리지 않게 함
- 대시보드 문구를 시스템 용어에서 이해하기 쉬운 말로 정리

### Fixed

- `.beacon/beacon.db` 손상·구버전 시 백업 후 자동 재생성(대시보드가 멈추지 않음)
- History가 표시 상한을 넘는 Timeline 이벤트도 누락 없이 누적

### Decisions

- 외부 도구 연동을 두지 않고 오프라인·로컬 정체성 유지(ADR 0002)
- P0–P4 고정 유지, 적용 대상을 제품 개발 프로젝트로 명확히(ADR 0003)

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
