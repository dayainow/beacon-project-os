import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { diffProjectSnapshots } from "./history.js";
import { BEACON_DIRECTORY, readConfig } from "./index.js";
import type { ProjectHealth, ProjectSnapshot } from "./scanner.js";

export const JOURNEY_VERSION = 1;

export interface CycleBaseline {
  snapshotId: number;
  scannedAt: string;
  gitHead: string | null;
  artifactPaths: string[];
}

export interface CycleHealthMark {
  score: ProjectHealth["score"];
  status: ProjectHealth["status"];
}

export interface CycleResult {
  endSnapshotId: number;
  endScannedAt: string;
  endGitHead: string | null;
  artifactsAdded: number;
  artifactsModified: number;
  artifactsDeleted: number;
  newCommits: number;
  healthBefore: CycleHealthMark;
  healthAfter: CycleHealthMark;
  gateBefore: string | null;
  gateAfter: string | null;
  readyStagesBefore: number;
  readyStagesAfter: number;
}

export interface ProjectCycle {
  id: string;
  sequence: number;
  name: string;
  goal: string;
  status: "active" | "completed";
  startedAt: string;
  completedAt: string | null;
  baseline: CycleBaseline;
  summary: string | null;
  result: CycleResult | null;
}

export interface ProjectJourney {
  version: typeof JOURNEY_VERSION;
  cycles: ProjectCycle[];
}

export interface StartProjectCycleInput {
  name: string;
  goal: string;
  snapshot: ProjectSnapshot;
  snapshotId: number;
  now?: Date;
}

function journeyPath(root: string): string {
  return path.join(path.resolve(root), BEACON_DIRECTORY, "journey.json");
}

function emptyJourney(): ProjectJourney {
  return { version: JOURNEY_VERSION, cycles: [] };
}

function isProjectCycle(value: unknown): value is ProjectCycle {
  if (!value || typeof value !== "object") return false;
  const cycle = value as Partial<ProjectCycle>;
  const baseline = cycle.baseline as Partial<CycleBaseline> | undefined;
  return (
    typeof cycle.id === "string"
    && typeof cycle.sequence === "number"
    && typeof cycle.name === "string"
    && typeof cycle.goal === "string"
    && (cycle.status === "active" || cycle.status === "completed")
    && typeof cycle.startedAt === "string"
    && (cycle.completedAt === null || typeof cycle.completedAt === "string")
    // summary·result는 v0.2.0 이전 기록에 없을 수 있어 undefined도 허용한다.
    && (cycle.summary === undefined || cycle.summary === null || typeof cycle.summary === "string")
    && (cycle.result === undefined || cycle.result === null || typeof cycle.result === "object")
    && typeof baseline?.snapshotId === "number"
    && typeof baseline.scannedAt === "string"
    && (baseline.gitHead === null || typeof baseline.gitHead === "string")
    && Array.isArray(baseline.artifactPaths)
    && baseline.artifactPaths.every((item) => typeof item === "string")
  );
}

function normalizeCycle(cycle: ProjectCycle): ProjectCycle {
  // 이전 버전 기록에 누락된 필드를 안전한 기본값으로 채워 읽는다.
  return {
    ...cycle,
    summary: cycle.summary ?? null,
    result: cycle.result ?? null,
  };
}

export async function readProjectJourney(root: string): Promise<ProjectJourney> {
  try {
    const contents = await readFile(journeyPath(root), "utf8");
    const value = JSON.parse(contents) as Partial<ProjectJourney>;
    if (
      value.version !== JOURNEY_VERSION
      || !Array.isArray(value.cycles)
      || !value.cycles.every(isProjectCycle)
    ) {
      throw new Error("지원하지 않는 Beacon Journey 설정입니다. 파일을 확인하거나 마이그레이션하세요.");
    }
    return { version: JOURNEY_VERSION, cycles: value.cycles.map(normalizeCycle) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyJourney();
    throw error;
  }
}

async function writeProjectJourney(root: string, journey: ProjectJourney): Promise<void> {
  const target = journeyPath(root);
  const temporary = `${target}.tmp`;
  await writeFile(temporary, `${JSON.stringify(journey, null, 2)}\n`, "utf8");
  await rename(temporary, target);
}

export async function startProjectCycle(
  root: string,
  input: StartProjectCycleInput,
): Promise<ProjectCycle> {
  await readConfig(root);
  const journey = await readProjectJourney(root);
  const active = journey.cycles.find((cycle) => cycle.status === "active");
  if (active) {
    throw new Error(`이미 진행 중인 Cycle이 있습니다: ${active.name}`);
  }

  const name = input.name.trim();
  const goal = input.goal.trim();
  if (!name) throw new Error("Cycle 이름을 입력하세요.");
  if (!goal) throw new Error("Cycle 목표를 --goal로 입력하세요.");

  const sequence = journey.cycles.reduce((maximum, cycle) => Math.max(maximum, cycle.sequence), 0) + 1;
  const cycle: ProjectCycle = {
    id: `cycle-${String(sequence).padStart(3, "0")}`,
    sequence,
    name,
    goal,
    status: "active",
    startedAt: (input.now ?? new Date()).toISOString(),
    completedAt: null,
    baseline: {
      snapshotId: input.snapshotId,
      scannedAt: input.snapshot.scannedAt,
      gitHead: input.snapshot.observation.git.head,
      artifactPaths: input.snapshot.observation.files.artifacts
        .filter((artifact) => artifact.scope === "project")
        .map((artifact) => artifact.path)
        .sort((left, right) => left.localeCompare(right)),
    },
    summary: null,
    result: null,
  };

  await writeProjectJourney(root, {
    version: JOURNEY_VERSION,
    cycles: [...journey.cycles, cycle],
  });
  return cycle;
}

export interface CompleteProjectCycleInput {
  startSnapshot: ProjectSnapshot;
  endSnapshot: ProjectSnapshot;
  endSnapshotId: number;
  summary?: string;
  now?: Date;
}

function healthMark(snapshot: ProjectSnapshot): CycleHealthMark {
  return { score: snapshot.health.score, status: snapshot.health.status };
}

function buildCycleResult(input: CompleteProjectCycleInput): CycleResult {
  const changes = diffProjectSnapshots(input.startSnapshot, input.endSnapshot);
  const artifactChanges = changes.filter((change) => change.entity === "artifact");
  return {
    endSnapshotId: input.endSnapshotId,
    endScannedAt: input.endSnapshot.scannedAt,
    endGitHead: input.endSnapshot.observation.git.head,
    artifactsAdded: artifactChanges.filter((change) => change.kind === "added").length,
    artifactsModified: artifactChanges.filter((change) => change.kind === "modified").length,
    artifactsDeleted: artifactChanges.filter((change) => change.kind === "deleted").length,
    newCommits: changes.filter((change) => change.entity === "commit").length,
    healthBefore: healthMark(input.startSnapshot),
    healthAfter: healthMark(input.endSnapshot),
    gateBefore: input.startSnapshot.process.currentStageId,
    gateAfter: input.endSnapshot.process.currentStageId,
    readyStagesBefore: input.startSnapshot.process.readyStages,
    readyStagesAfter: input.endSnapshot.process.readyStages,
  };
}

export async function completeProjectCycle(
  root: string,
  input: CompleteProjectCycleInput,
): Promise<ProjectCycle> {
  await readConfig(root);
  const journey = await readProjectJourney(root);
  const activeIndex = journey.cycles.findIndex((cycle) => cycle.status === "active");
  if (activeIndex === -1) {
    throw new Error("종료할 진행 중인 Cycle이 없습니다.");
  }

  const summary = input.summary?.trim() ?? "";
  const completed: ProjectCycle = {
    ...journey.cycles[activeIndex],
    status: "completed",
    completedAt: (input.now ?? new Date()).toISOString(),
    summary: summary || null,
    result: buildCycleResult(input),
  };

  const cycles = [...journey.cycles];
  cycles[activeIndex] = completed;
  await writeProjectJourney(root, { version: JOURNEY_VERSION, cycles });
  return completed;
}
