# External Evaluation 0001 — Saleor Storefront

| 항목 | 내용 |
|---|---|
| 대상 | `saleor/storefront` |
| 기준 commit | `d5c7831` |
| 평가일 | 2026-07-15 |
| 기준 Beacon | `v0.1.0` |
| 목적 | Goodz와 무관한 실제 쇼핑몰 저장소에서 문서·Gate·Timeline 판정 검증 |

## 평가 방법

Saleor Storefront를 최근 50개 commit과 함께 별도 폴더에 clone했다. 쇼핑몰 의존성이나 서버는 실행하지 않았으며 공개 Beacon tarball을 별도 runner에 설치해 대상 폴더만 관찰했다. 원본 README, `AGENTS.md`, `docs/adr`, test source와 Git log를 Dashboard/API 결과와 대조했다.

## v0.1.0 기준 결과

| 지표 | 결과 | 판단 |
|---|---:|---|
| Health | 100% | 지원 문서를 핵심 근거로 사용해 과대평가 |
| 발견 문서 | 102개 | project와 skill 문서가 한 목록에 섞임 |
| 현재 Gate | P4 | P0 기획이 준비됐다는 판정이 오탐 |
| Timeline `change` | 18/20 | 비-Conventional commit 의미를 거의 설명하지 못함 |

### 확인한 오탐

- `skills/.../product-pdp.md`, `product-filtering.md`, `product-variants.md`를 P0 기획 근거로 사용했다.
- `skills/.../design-*.md`를 프로젝트 설계 근거로 먼저 제시했다.
- 실제 프로젝트 설계 근거인 `docs/adr/0001-*`부터 `0003-*`가 지원 규칙보다 뒤에 가려졌다.
- `.beacon/project.json`이 아직 commit되지 않아 Working Tree 확인 신호가 생겼다. 이는 설정을 버전 관리할지 결정하라는 의도된 신호다.

## 개선 계약

1. 산출물을 `project`와 `support` 범위로 구분한다.
2. `skills`, `.agents`, `.claude`, `.cursor`, `.github` 문서는 지원 범위로 유지하되 Health와 Gate 근거에서 제외한다.
3. `product`는 파일명 전체가 `PRODUCT`일 때만 기획 문서로 인정하고 도메인 기능 문서의 오탐을 막는다.
4. Dashboard는 핵심 산출물 수와 지원 문서 수를 분리하고 핵심 문서를 먼저 보여준다.
5. 일반 commit 제목도 명시적인 동사에 한해 의미 범주를 부여한다.
6. 5개 Health 기준 중 하나라도 부족하면 `on_track` 대신 `attention`으로 표시한다.

## 개선판 재측정

| 지표 | v0.1.0 | 개선판 |
|---|---:|---:|
| Health | 100% / on track | 80% / attention |
| 산출물 범위 | 102개 혼합 | 핵심 14개 / 지원 88개 |
| 현재 Gate | P4 | P0 기획 근거 필요 |
| P1 설계 출처 | skill design 규칙 | `docs/adr/*` 3개 |
| Timeline `change` | 18/20 | 4/20 |

개선판은 Saleor가 구현·테스트·ADR은 충분하지만 명시적인 프로젝트 기획 기준과 릴리스 문서는 자동 발견되지 않았다고 설명한다. 이는 파일·Git에서 확인 가능한 근거와 일치하며, P0와 P4가 사람의 검토 대상이라는 의미이지 프로젝트 품질이 낮다는 단정이 아니다.
