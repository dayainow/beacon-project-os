import type { DiscoveredArtifact, ProjectObservation } from "./scanner.js";

export type ProcessStageId = "p0" | "p1" | "p2" | "p3" | "p4";
export type GateStatus = "ready" | "needs_evidence";
export type StageState = "ready" | "current" | "upcoming";

export interface GateRequirementAssessment {
  id: string;
  label: string;
  satisfied: boolean;
  evidence: string[];
  sources: string[];
  nextAction: string;
}

export interface StageGateAssessment {
  status: GateStatus;
  satisfiedRequirements: number;
  totalRequirements: number;
  requirements: GateRequirementAssessment[];
}

export interface ProcessStageAssessment {
  id: ProcessStageId;
  name: string;
  objective: string;
  state: StageState;
  gate: StageGateAssessment;
}

export interface ProjectProcessAssessment {
  templateId: "beacon-default-p0-p4-v1";
  currentStageId: ProcessStageId | null;
  readyStages: number;
  totalStages: 5;
  stages: ProcessStageAssessment[];
}

interface StageDefinition {
  id: ProcessStageId;
  name: string;
  objective: string;
  requirements: (observation: ProjectObservation) => GateRequirementAssessment[];
}

function artifactsOfKind(observation: ProjectObservation, kind: DiscoveredArtifact["kind"]): DiscoveredArtifact[] {
  return observation.files.artifacts.filter((artifact) => artifact.scope === "project" && artifact.kind === kind);
}

function documentRequirement(options: {
  id: string;
  label: string;
  artifacts: DiscoveredArtifact[];
  missingEvidence: string;
  nextAction: string;
}): GateRequirementAssessment {
  return {
    id: options.id,
    label: options.label,
    satisfied: options.artifacts.length > 0,
    evidence: options.artifacts.length > 0
      ? [`관련 산출물 ${options.artifacts.length}개 발견`]
      : [options.missingEvidence],
    sources: options.artifacts.length > 0
      ? options.artifacts.slice(0, 5).map((artifact) => artifact.path)
      : ["filesystem scan"],
    nextAction: options.nextAction,
  };
}

const STAGES: StageDefinition[] = [
  {
    id: "p0",
    name: "기획",
    objective: "프로젝트 목적과 범위를 확인합니다.",
    requirements: (observation) => {
      const rootOverview = artifactsOfKind(observation, "overview")
        .filter((artifact) => !artifact.path.includes("/"));
      return [
        documentRequirement({
          id: "p0-overview",
          label: "루트 프로젝트 소개",
          artifacts: rootOverview,
          missingEvidence: "루트 README 0개",
          nextAction: "루트 README에 프로젝트 목적과 시작 방법을 작성하세요.",
        }),
        documentRequirement({
          id: "p0-plan",
          label: "기획 기준",
          artifacts: artifactsOfKind(observation, "planning"),
          missingEvidence: "기획 문서 0개",
          nextAction: "PRD 또는 PRODUCT 문서에 목표, MVP와 비목표를 고정하세요.",
        }),
      ];
    },
  },
  {
    id: "p1",
    name: "디자인",
    objective: "구조와 중요한 설계 결정을 확인합니다.",
    requirements: (observation) => [documentRequirement({
      id: "p1-architecture",
      label: "설계 기준",
      artifacts: artifactsOfKind(observation, "architecture"),
      missingEvidence: "설계 문서 0개",
      nextAction: "Architecture, Design 또는 ADR 문서로 핵심 구조와 결정을 기록하세요.",
    })],
  },
  {
    id: "p2",
    name: "개발",
    objective: "구현과 변경 이력이 연결되어 있는지 확인합니다.",
    requirements: (observation) => [
      {
        id: "p2-source",
        label: "구현 소스",
        satisfied: observation.files.source > 0,
        evidence: [`소스 파일 ${observation.files.source}개`],
        sources: ["filesystem source scan"],
        nextAction: "실행 가능한 최소 구현을 프로젝트 폴더에 추가하세요.",
      },
      {
        id: "p2-history",
        label: "구현 변경 이력",
        satisfied: observation.git.recentCommits.length > 0,
        evidence: [`최근 commit ${observation.git.recentCommits.length}개`],
        sources: observation.git.recentCommits.length > 0
          ? observation.git.recentCommits.slice(0, 3).map((commit) => `git:${commit.shortHash}`)
          : ["git log"],
        nextAction: "현재 구현 기준선을 의미 있는 Git commit으로 남기세요.",
      },
    ],
  },
  {
    id: "p3",
    name: "검증",
    objective: "테스트 또는 검증 산출물의 근거를 확인합니다.",
    requirements: (observation) => {
      const qualityArtifacts = artifactsOfKind(observation, "quality");
      const satisfied = observation.files.tests > 0 || qualityArtifacts.length > 0;
      return [{
        id: "p3-evidence",
        label: "검증 증거",
        satisfied,
        evidence: [
          `테스트 소스 ${observation.files.tests}개`,
          `검증 문서 ${qualityArtifacts.length}개`,
        ],
        sources: [
          ...(observation.files.tests > 0 ? ["filesystem test patterns"] : []),
          ...qualityArtifacts.slice(0, 4).map((artifact) => artifact.path),
          ...(satisfied ? [] : ["filesystem scan"]),
        ],
        nextAction: "핵심 흐름의 자동 테스트 또는 QA·검증 결과 문서를 추가하세요.",
      }];
    },
  },
  {
    id: "p4",
    name: "배포",
    objective: "릴리스 가능한 결과와 전달 기록을 확인합니다.",
    requirements: (observation) => [documentRequirement({
      id: "p4-release",
      label: "릴리스 산출물",
      artifacts: artifactsOfKind(observation, "release"),
      missingEvidence: "릴리스 문서 0개",
      nextAction: "CHANGELOG 또는 release 문서에 버전, 변경점과 전달 결과를 기록하세요.",
    })],
  },
];

export function assessProjectProcess(observation: ProjectObservation): ProjectProcessAssessment {
  const gates = STAGES.map((stage) => {
    const requirements = stage.requirements(observation);
    const satisfiedRequirements = requirements.filter((requirement) => requirement.satisfied).length;
    return {
      definition: stage,
      gate: {
        status: satisfiedRequirements === requirements.length ? "ready" as const : "needs_evidence" as const,
        satisfiedRequirements,
        totalRequirements: requirements.length,
        requirements,
      },
    };
  });
  const currentIndex = gates.findIndex(({ gate }) => gate.status === "needs_evidence");

  return {
    templateId: "beacon-default-p0-p4-v1",
    currentStageId: currentIndex === -1 ? null : gates[currentIndex].definition.id,
    readyStages: gates.filter(({ gate }) => gate.status === "ready").length,
    totalStages: 5,
    stages: gates.map(({ definition, gate }, index) => ({
      id: definition.id,
      name: definition.name,
      objective: definition.objective,
      state: currentIndex === -1 || index < currentIndex
        ? "ready"
        : index === currentIndex
          ? "current"
          : "upcoming",
      gate,
    })),
  };
}
