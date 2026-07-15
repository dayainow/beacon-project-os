import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { BEACON_DIRECTORY, readConfig } from "./index.js";
import type { ProjectSnapshot } from "./scanner.js";

export const JOURNEY_VERSION = 1;

export interface CycleBaseline {
  snapshotId: number;
  scannedAt: string;
  gitHead: string | null;
  artifactPaths: string[];
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
    && typeof baseline?.snapshotId === "number"
    && typeof baseline.scannedAt === "string"
    && (baseline.gitHead === null || typeof baseline.gitHead === "string")
    && Array.isArray(baseline.artifactPaths)
    && baseline.artifactPaths.every((item) => typeof item === "string")
  );
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
    return value as ProjectJourney;
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
  };

  await writeProjectJourney(root, {
    version: JOURNEY_VERSION,
    cycles: [...journey.cycles, cycle],
  });
  return cycle;
}
