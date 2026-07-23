import type { ArtifactKind } from "./scanner.js";

// 각 문서 종류가 갖추면 좋은 구성 요소. 판정이 아니라 "있으면 더 좋아요" 수준의 제안이다.
// 매칭은 헤딩 정확 일치가 아니라 본문 어디든 키워드가 있으면 인정하는 유연 방식이다.
export interface DocumentSectionCheck {
  id: string;
  label: string;
  present: boolean;
  suggestion: string;
}

export interface DocumentAssessment {
  kind: ArtifactKind;
  checks: DocumentSectionCheck[];
  present: DocumentSectionCheck[];
  missing: DocumentSectionCheck[];
}

interface SectionRule {
  id: string;
  label: string;
  keywords: string[];
  suggestion: string;
}

// 보편적인 최소 항목만 담는다. 과하게 규정하지 않는다(자유형 문서 오판 방지).
const CHECKLISTS: Partial<Record<ArtifactKind, SectionRule[]>> = {
  overview: [
    { id: "purpose", label: "프로젝트 목적", keywords: ["목적", "무엇", "소개", "개요", "purpose", "about", "what is"], suggestion: "이 프로젝트가 무엇이고 왜 필요한지 한두 문장으로 적어보세요." },
    { id: "install", label: "설치·실행 방법", keywords: ["설치", "실행", "시작", "install", "setup", "getting started", "usage 방법", "quick start"], suggestion: "설치와 실행 방법(명령 예시)을 추가하면 팀원이 바로 시작할 수 있어요." },
    { id: "usage", label: "사용법", keywords: ["사용", "사용법", "usage", "example", "예시", "how to"], suggestion: "기본 사용법이나 예시를 넣으면 이해가 빨라져요." },
  ],
  planning: [
    { id: "problem", label: "해결할 문제", keywords: ["문제", "배경", "problem", "background", "why"], suggestion: "어떤 문제를 푸는지 적으면 방향이 분명해져요." },
    { id: "users", label: "목표 사용자", keywords: ["사용자", "고객", "대상", "user", "audience", "persona"], suggestion: "누구를 위한 것인지(목표 사용자)를 밝혀보세요." },
    { id: "mvp", label: "MVP·범위", keywords: ["mvp", "범위", "scope", "핵심 기능", "must have"], suggestion: "첫 버전에 무엇까지 넣을지(MVP·범위)를 정하면 좋아요." },
    { id: "non-goals", label: "비목표", keywords: ["비목표", "하지 않", "제외", "non-goal", "out of scope", "not doing"], suggestion: "이번에 하지 않을 것(비목표)을 적으면 범위가 흐려지지 않아요." },
  ],
  architecture: [
    { id: "components", label: "구성요소·구조", keywords: ["구성", "구조", "컴포넌트", "모듈", "component", "structure", "architecture", "경계"], suggestion: "핵심 구성요소와 구조를 정리해보세요." },
    { id: "data-ownership", label: "데이터 소유권", keywords: ["데이터", "소유권", "저장", "data", "ownership", "storage", "schema"], suggestion: "어떤 데이터를 누가/어디서 소유하는지 적으면 경계가 분명해져요." },
    { id: "decisions", label: "주요 결정", keywords: ["결정", "선택", "이유", "decision", "trade-off", "rationale", "왜"], suggestion: "중요한 설계 결정과 그 이유를 남기면 나중에 되짚기 좋아요." },
  ],
  quality: [
    { id: "scope", label: "검증 대상·범위", keywords: ["대상", "범위", "scope", "coverage", "무엇을 검증"], suggestion: "무엇을 검증하는지(대상·범위)를 적어보세요." },
    { id: "method", label: "검증 방법", keywords: ["방법", "절차", "how", "method", "steps", "테스트"], suggestion: "어떻게 검증하는지(방법·절차)를 넣으면 재현할 수 있어요." },
    { id: "expected", label: "기대 결과", keywords: ["기대", "결과", "통과", "expected", "result", "pass", "기준"], suggestion: "무엇이 나오면 통과인지(기대 결과)를 정하면 좋아요." },
  ],
  release: [
    { id: "version", label: "버전", keywords: ["버전", "version", "v0", "v1", "release"], suggestion: "버전 번호를 명시하면 어떤 릴리스인지 분명해져요." },
    { id: "changes", label: "변경점", keywords: ["변경", "추가", "수정", "change", "added", "fixed", "feature"], suggestion: "이번에 무엇이 바뀌었는지(변경점)를 적어보세요." },
    { id: "delivery", label: "설치·전달", keywords: ["설치", "배포", "전달", "install", "deploy", "download", "upgrade"], suggestion: "어떻게 설치·전달하는지 안내를 넣으면 좋아요." },
  ],
};

export function assessDocument(kind: ArtifactKind, content: string): DocumentAssessment {
  const rules = CHECKLISTS[kind] ?? [];
  const haystack = content.toLowerCase();
  const checks: DocumentSectionCheck[] = rules.map((rule) => {
    const present = rule.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
    return { id: rule.id, label: rule.label, present, suggestion: rule.suggestion };
  });

  return {
    kind,
    checks,
    present: checks.filter((check) => check.present),
    missing: checks.filter((check) => !check.present),
  };
}
