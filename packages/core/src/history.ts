import type {
  DiscoveredArtifact,
  GitCommit,
  ProjectSnapshot,
} from "./scanner.js";

export type ProjectChangeKind = "added" | "modified" | "deleted";
export type ProjectChangeEntity = "artifact" | "commit";

export interface ProjectChange {
  id: string;
  kind: ProjectChangeKind;
  entity: ProjectChangeEntity;
  detectedAt: string;
  title: string;
  detail: string;
  source: "filesystem" | "git";
  reference: string;
  before: DiscoveredArtifact | GitCommit | null;
  after: DiscoveredArtifact | GitCommit | null;
}

function changeId(
  snapshot: ProjectSnapshot,
  kind: ProjectChangeKind,
  entity: ProjectChangeEntity,
  reference: string,
): string {
  return ["change", snapshot.scannedAt, kind, entity, reference].join(":");
}

function artifactChanged(before: DiscoveredArtifact, after: DiscoveredArtifact): boolean {
  return before.name !== after.name
    || before.kind !== after.kind
    || (before.scope !== undefined && before.scope !== after.scope)
    || before.modifiedAt !== after.modifiedAt;
}

export function diffProjectSnapshots(
  previous: ProjectSnapshot | null,
  current: ProjectSnapshot,
): ProjectChange[] {
  if (!previous) return [];

  const changes: ProjectChange[] = [];
  const previousArtifacts = new Map(
    previous.observation.files.artifacts.map((artifact) => [artifact.path, artifact]),
  );
  const currentArtifacts = new Map(
    current.observation.files.artifacts.map((artifact) => [artifact.path, artifact]),
  );

  for (const [artifactPath, artifact] of currentArtifacts) {
    const before = previousArtifacts.get(artifactPath);
    if (!before) {
      changes.push({
        id: changeId(current, "added", "artifact", artifactPath),
        kind: "added",
        entity: "artifact",
        detectedAt: current.scannedAt,
        title: `${artifact.name} 산출물 추가`,
        detail: "이전 스캔에 없던 문서 산출물을 발견했습니다.",
        source: "filesystem",
        reference: artifactPath,
        before: null,
        after: artifact,
      });
    } else if (artifactChanged(before, artifact)) {
      changes.push({
        id: changeId(current, "modified", "artifact", artifactPath),
        kind: "modified",
        entity: "artifact",
        detectedAt: current.scannedAt,
        title: `${artifact.name} 산출물 변경`,
        detail: "문서의 종류 또는 수정 시각이 이전 스캔과 달라졌습니다.",
        source: "filesystem",
        reference: artifactPath,
        before,
        after: artifact,
      });
    }
  }

  for (const [artifactPath, artifact] of previousArtifacts) {
    if (currentArtifacts.has(artifactPath)) continue;
    changes.push({
      id: changeId(current, "deleted", "artifact", artifactPath),
      kind: "deleted",
      entity: "artifact",
      detectedAt: current.scannedAt,
      title: `${artifact.name} 산출물 삭제`,
      detail: "이전 스캔에 있던 문서 산출물을 현재 폴더에서 찾지 못했습니다.",
      source: "filesystem",
      reference: artifactPath,
      before: artifact,
      after: null,
    });
  }

  const previousCommits = new Set(
    previous.observation.git.recentCommits.map((commit) => commit.hash),
  );
  for (const commit of current.observation.git.recentCommits) {
    if (previousCommits.has(commit.hash)) continue;
    changes.push({
      id: changeId(current, "added", "commit", commit.hash),
      kind: "added",
      entity: "commit",
      detectedAt: current.scannedAt,
      title: commit.subject,
      detail: `새 Git commit ${commit.shortHash}을 발견했습니다.`,
      source: "git",
      reference: commit.shortHash,
      before: null,
      after: commit,
    });
  }

  return changes.sort((left, right) => (
    left.entity.localeCompare(right.entity)
      || left.reference.localeCompare(right.reference)
      || left.kind.localeCompare(right.kind)
  ));
}
