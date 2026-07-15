# Beacon Product

| 항목 | 내용 |
|---|---|
| 상태 | P0 기준선 |
| 제품명 | Beacon |
| 저장소 | `dayainow/beacon-project-os` |
| 기준일 | 2026-07-15 |

> Beacon은 프로젝트 폴더에서 시작해 현재 방향, 부족한 부분, 산출물과 변경 이력을 보여주는 로컬 우선 Project Navigation OS다.

## 해결할 문제

프로젝트의 문서, 코드, Git 이력과 의사결정이 여러 도구에 흩어져 팀이 현재 상태와 빠진 부분을 한눈에 확인하기 어렵다. 증거와 산출물을 운영 도구에 매번 다시 등록하는 방식은 실제 프로젝트와 관리 화면을 쉽게 어긋나게 한다.

Beacon은 실제 프로젝트 폴더를 프로젝트 그 자체로 취급한다. 자동으로 발견할 수 있는 정보는 파일과 Git에서 읽고, 부족한 항목에는 근거와 다음 행동을 붙인다. 프로젝트 종료 시에는 과정, 변경, 문제와 산출물을 Project Book으로 남긴다.

## 첫 번째 세로 흐름

```text
임의의 프로젝트 폴더
→ beacon init
→ beacon open
→ 현재 폴더의 Project Identity 표시
```

### 인수 조건

- 별도 프로젝트 폴더에서 2분 안에 초기화하고 화면을 열 수 있다.
- 화면은 고정 샘플이 아니라 현재 폴더 이름을 표시한다.
- Git 저장소라면 현재 branch와 commit을 표시한다.
- Goodz checkout이나 Commerce Reference가 없어도 동작한다.

## MVP

- 단일 로컬 프로젝트 폴더
- Project Identity
- P0–P4 Process Run과 Gate
- 로컬 파일·Git 스캐너
- 출처가 있는 산출물 목록
- 설명 가능한 Project Health 신호
- 의미 단위 Timeline
- 프로젝트 전용 SQLite
- 최대 5개의 기본 메뉴: 개요, 단계, 산출물, 히스토리, 설정

## 비목표

- 여러 프로젝트 Portfolio와 조직 관리
- 계정, RBAC, Cloud 동기화
- Commerce 등 도메인 Reference 번들
- Template Builder
- 자동 branch, push, Pull Request
- AI의 Gate 자동 승인
- 기존 Goodz Dashboard 전체 이식

## 제품 원칙

1. 프로젝트 폴더가 원본을 소유한다.
2. `.beacon/` 파생 인덱스는 삭제 후 재생성할 수 있어야 한다.
3. 자동 발견을 기본으로 하고 수동 입력은 수정과 예외 처리로 제한한다.
4. 모든 건강 신호는 근거, 출처와 다음 행동을 제공한다.
5. 새 계약과 테스트를 먼저 작성하고 필요한 기존 코드만 선별 이식한다.

