# Beacon — Agent Instructions

## 제품 목적

Beacon은 사용자 프로젝트 폴더에서 실행되어 현재 방향, 부족한 부분, 산출물과 변경 이력을 보여주는 로컬 우선 Project Navigation OS다.

## 작업 원칙

1. 패키지 매니저는 `pnpm`만 사용한다.
2. 프로젝트 폴더가 원본이며 `.beacon/`의 파생 데이터는 재생성 가능해야 한다.
3. 자동 발견을 기본으로 하고 수동 입력은 수정과 예외 처리에만 사용한다.
4. 건강 신호에는 근거, 출처, 다음 행동을 함께 제공한다.
5. 기능을 추가하기 전에 `docs/PRODUCT.md`의 MVP와 비목표를 확인한다.
6. Goodz 코드는 폴더째 복사하지 않고 `docs/adr/0001-goodz-provenance.md`에 출처와 이유를 남긴 뒤 선별 이식한다.
7. 작업 완료 전 `pnpm verify`를 통과한다.

