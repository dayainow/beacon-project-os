# 배포 준비와 절차

| 항목 | 내용 |
|---|---|
| 작성일 | 2026-07-22 |
| 대상 패키지 | `@dayainow/beacon` |
| 현재 버전 | `v0.2.0` |
| 상태 | 배포 준비 완료 — 실제 publish는 권한 있는 사람이 아래 절차로 수행 |

> 이 문서는 배포를 "지금 실행"하지 않는다. Beacon을 npm 또는 GitHub Release로 내보낼 때 밟을 절차와 사전 점검을 정리한다.

## 현재 배포 준비 상태

| 항목 | 상태 |
|---|---|
| 패키지 이름 | `@dayainow/beacon` (scoped) |
| `bin` | `beacon` → `dist/index.js` |
| `files` | `dist/index.js`, `README.md` (군더더기 없이 실행 파일만) |
| `publishConfig.access` | `public` (scoped 패키지 공개 배포 설정 완료) |
| 런타임 의존성 | 없음 (esbuild로 단일 파일 번들) |
| `engines` | Node `>=22.13` |
| clean-room 검증 | `pnpm verify:package`로 tarball 설치·구동 자동 검증 통과 |
| CI | main·PR에서 `pnpm verify` 자동 실행(통과 확인됨) |

→ 배포에 필요한 패키지 설정은 모두 되어 있다. 남은 것은 "누가·언제 publish 버튼을 누르는가"뿐이다.

## 사전 점검 (배포 전 반드시)

```bash
# 1. 깨끗한 상태에서 전체 검증 (CI와 동일)
pnpm verify

# 2. tarball 내용 확인 (의도한 파일만 들어가는지)
pnpm --filter @dayainow/beacon pack --dry-run

# 3. 버전 확인 — 이미 배포된 버전과 같으면 안 됨
npm view @dayainow/beacon version 2>/dev/null   # 배포 이력 확인
```

## 절차 A — npm 배포 (권장)

```bash
# 0. npm 로그인 (배포 권한 있는 계정)
npm whoami || npm login

# 1. 버전 올리기 (semver: patch/minor/major)
#    CHANGELOG·release 문서도 함께 갱신한다.
pnpm --filter @dayainow/beacon exec npm version <patch|minor|major>

# 2. 최종 검증
pnpm verify

# 3. 배포 (scoped 공개 패키지)
pnpm --filter @dayainow/beacon publish --access public

# 4. git 태그·푸시
git tag v<새버전> && git push --tags
```

배포 후 사용자는 이렇게 설치한다:

```bash
pnpm add --save-dev @dayainow/beacon   # 또는 --global
```

## 절차 B — GitHub Release tarball (현재 방식 유지)

npm 배포 없이 지금처럼 GitHub Release에 tarball을 올리는 방식도 유효하다.

```bash
pnpm --filter @dayainow/beacon pack        # dayainow-beacon-<버전>.tgz 생성
# 생성된 .tgz를 GitHub Release 자산으로 업로드
```

사용자 설치:

```bash
pnpm add --save-dev https://github.com/dayainow/beacon-project-os/releases/download/v<버전>/dayainow-beacon-<버전>.tgz
```

## 자동화(선택) — 태그 푸시 시 자동 배포

`.github/workflows/`에 release 워크플로를 추가하면 `v*` 태그 푸시 시 자동 publish할 수 있다. 단, npm 토큰(`NPM_TOKEN`)을 저장소 Secret으로 등록해야 하며, 자동 배포는 오배포 위험이 있으므로 **환경 보호 규칙(수동 승인)** 과 함께 도입한다. 지금은 수동 절차(A/B)를 기본으로 둔다.

## 버전 정책

- **patch** (`0.2.x`): 버그 수정·문구·UI 개선처럼 동작 계약이 그대로일 때.
- **minor** (`0.x.0`): 새 화면·기능·API 추가처럼 하위 호환되는 확장.
- **major** (`x.0.0`): 판정 규칙·API·데이터 스키마의 하위 호환이 깨지는 변경.

각 배포는 `docs/releases/vX.Y.Z.md`에 변경점을 남긴다.
