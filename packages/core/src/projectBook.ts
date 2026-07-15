import type { ProjectChange } from "./history.js";
import type { ProjectSnapshot, TimelineEvent } from "./scanner.js";

export interface ProjectBookIdentity {
  name: string;
  root: string;
  gitBranch: string | null;
  gitHead: string | null;
  initializedAt: string;
}

export interface ProjectBookHistory {
  snapshotCount: number;
  changeCount: number;
  timelineCount: number;
  latestSnapshotAt: string | null;
  changes: Array<ProjectChange & { sequence?: number; snapshotId?: number }>;
  timeline: TimelineEvent[];
}

export interface ProjectBookInput {
  identity: ProjectBookIdentity;
  snapshot: ProjectSnapshot;
  history: ProjectBookHistory;
}

const artifactLabels = {
  overview: "개요",
  planning: "기획",
  architecture: "설계",
  quality: "검증",
  release: "릴리스",
  document: "문서",
} as const;

const changeLabels = {
  added: "추가",
  modified: "변경",
  deleted: "삭제",
} as const;

const categoryLabels = {
  planning: "기획",
  design: "설계",
  implementation: "기능",
  issue: "문제 해결",
  quality: "검증",
  delivery: "릴리스",
  operations: "운영",
  documentation: "문서",
  change: "변경",
} as const;

function cell(value: unknown): string {
  return String(value ?? "—").replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
}

function inlineCode(value: string): string {
  return value.includes("`") ? `\`\`${value}\`\`` : `\`${value}\``;
}

function table(headers: string[], rows: string[][]): string {
  const content = rows.length > 0 ? rows : [["—", ...headers.slice(1).map(() => "—")]];
  return [
    `| ${headers.map(cell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...content.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}

export function generateProjectBook({ identity, snapshot, history }: ProjectBookInput): string {
  const processRows = snapshot.process.stages.map((stage) => [
    stage.id.toUpperCase(),
    stage.name,
    stage.gate.status === "ready" ? "근거 준비" : "증거 부족",
    `${stage.gate.satisfiedRequirements}/${stage.gate.totalRequirements}`,
    stage.state === "current" ? "현재 단계" : stage.state === "ready" ? "선행 근거 준비" : "후속 단계",
  ]);
  const focusStage = snapshot.process.stages.find((stage) => stage.id === snapshot.process.currentStageId);
  const missingRequirements = focusStage?.gate.requirements.filter((requirement) => !requirement.satisfied) ?? [];
  const gateDetails = missingRequirements.length > 0
    ? missingRequirements.map((requirement) => [
        requirement.label,
        requirement.evidence.join(" · "),
        requirement.sources.join(", "),
        requirement.nextAction,
      ])
    : [["모든 자동 근거 준비", "자동 관찰 기준 충족", "Beacon scan", "사람이 Gate 결정을 검토하세요."]];

  const artifactRows = snapshot.observation.files.artifacts.map((artifact) => [
    artifactLabels[artifact.kind],
    inlineCode(artifact.path),
    artifact.modifiedAt,
    artifact.source,
  ]);
  const changeRows = history.changes.map((change) => [
    change.detectedAt,
    changeLabels[change.kind],
    change.entity === "artifact" ? "산출물" : "Git commit",
    inlineCode(change.reference),
    change.title,
  ]);
  const timelineRows = history.timeline.map((event) => [
    event.occurredAt,
    categoryLabels[event.category],
    event.type === "commit" ? "Git" : "파일",
    inlineCode(event.reference),
    event.title,
  ]);

  const currentStage = focusStage
    ? `${focusStage.id.toUpperCase()} ${focusStage.name}`
    : "P0–P4 자동 근거 준비";

  return `# ${cell(identity.name)} Project Book

> Beacon이 프로젝트 폴더의 파일, Git과 누적 History에서 생성한 현재 기준 문서입니다. 자동 관찰은 사람의 Gate 승인과 의사결정을 대신하지 않습니다.

## 프로젝트 정체성

| 항목 | 값 |
| --- | --- |
| 프로젝트 | ${cell(identity.name)} |
| 초기화 | ${cell(identity.initializedAt)} |
| Git branch | ${cell(identity.gitBranch)} |
| Git HEAD | ${cell(identity.gitHead)} |
| 생성 시각 | ${cell(snapshot.scannedAt)} |

## 현재 요약

- Project Health: **${snapshot.health.score}%** — ${cell(snapshot.health.headline)}
- 현재 Process: **${currentStage}**
- 준비된 단계: **${snapshot.process.readyStages}/${snapshot.process.totalStages}**
- 발견한 산출물: **${snapshot.observation.files.artifacts.length}개**
- 저장된 기준선: **${history.snapshotCount}개**
- 누적 변화: **${history.changeCount}개**
- 누적 Timeline: **${history.timelineCount}개**

## P0–P4 Gate 준비도

${table(["단계", "이름", "Gate", "근거", "상태"], processRows)}

### 현재 Gate에서 필요한 것

${table(["요구조건", "근거", "출처", "다음 행동"], gateDetails)}

## 발견한 산출물

${table(["종류", "경로", "수정 시각", "출처"], artifactRows)}

## 스캔 사이의 변화

${table(["감지 시각", "변화", "대상", "참조", "내용"], changeRows)}

## Project Timeline

${table(["발생 시각", "범주", "출처", "참조", "내용"], timelineRows)}

## 생성 정보

- Template: ${inlineCode(snapshot.process.templateId)}
- 마지막 저장 기준선: ${cell(history.latestSnapshotAt)}
- 파일 관찰 제한 도달: ${snapshot.observation.files.truncated ? "예" : "아니요"}
- 생성 도구: Beacon Project OS
`;
}

