import { execFileSync } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { assessProjectProcess, type ProjectProcessAssessment } from "./process.js";

const IGNORED_DIRECTORIES = new Set([
  ".beacon",
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
]);

const DOCUMENT_EXTENSIONS = new Set([
  ".doc",
  ".docx",
  ".md",
  ".mdx",
  ".pdf",
  ".ppt",
  ".pptx",
  ".txt",
  ".xls",
  ".xlsx",
]);

const SOURCE_EXTENSIONS = new Set([
  ".astro",
  ".c",
  ".cpp",
  ".css",
  ".go",
  ".html",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".scss",
  ".swift",
  ".ts",
  ".tsx",
  ".vue",
]);

const CONFIG_NAMES = new Set([
  ".editorconfig",
  ".env.example",
  ".gitignore",
  "dockerfile",
  "package.json",
  "pnpm-workspace.yaml",
  "pyproject.toml",
  "tsconfig.json",
]);

const MAX_FILES = 10_000;
// 판정(단계·Gate)이 시점에 따라 흔들리지 않도록 충분한 이력을 관찰한다.
// Timeline 표시는 MAX_TIMELINE_EVENTS로, 누적은 History(SQLite)로 제한하므로 이 값이 커도 UI는 폭발하지 않는다.
const MAX_GIT_COMMITS = 500;
const MAX_TIMELINE_EVENTS = 30;

function isGeneratedProjectBook(relativePath: string): boolean {
  return relativePath.replace(/\\/g, "/").split("/").pop()?.toLowerCase() === "project_book.md";
}

function isBeaconInternalPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return normalized === ".beacon" || normalized.startsWith(".beacon/");
}

function isObservedGitPath(relativePath: string): boolean {
  return !isGeneratedProjectBook(relativePath) && !isBeaconInternalPath(relativePath);
}

export type ArtifactKind =
  | "overview"
  | "planning"
  | "architecture"
  | "quality"
  | "release"
  | "document";

export type ArtifactScope = "project" | "support";

export interface DiscoveredArtifact {
  path: string;
  name: string;
  kind: ArtifactKind;
  scope: ArtifactScope;
  modifiedAt: string;
  source: "filesystem";
}

export interface FileObservation {
  total: number;
  source: number;
  tests: number;
  config: number;
  truncated: boolean;
  artifacts: DiscoveredArtifact[];
}

export interface GitChange {
  path: string;
  status: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  authoredAt: string;
  subject: string;
  paths: string[];
}

export interface GitObservation {
  isRepository: boolean;
  root: string | null;
  branch: string | null;
  head: string | null;
  changedFiles: GitChange[];
  recentCommits: GitCommit[];
}

export interface ProjectObservation {
  files: FileObservation;
  git: GitObservation;
}

export type SignalLevel = "ready" | "attention" | "warning";

export interface ProjectSignal {
  id: string;
  level: SignalLevel;
  title: string;
  detail: string;
  evidence: string[];
  sources: string[];
  nextAction: string;
}

export interface ProjectHealth {
  status: "on_track" | "attention" | "at_risk";
  score: number;
  passedChecks: number;
  totalChecks: number;
  headline: string;
  signals: ProjectSignal[];
}

export type TimelineEventType = "artifact" | "commit";

export type TimelineCategory =
  | "planning"
  | "design"
  | "implementation"
  | "issue"
  | "quality"
  | "delivery"
  | "operations"
  | "documentation"
  | "change";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  category: TimelineCategory;
  occurredAt: string;
  title: string;
  detail: string;
  source: string;
  reference: string;
  relatedArtifacts: string[];
  author?: string;
}

export interface ProjectTimeline {
  events: TimelineEvent[];
  total: number;
  truncated: boolean;
}

export interface TimelineDay {
  date: string;
  total: number;
  categoryCounts: Partial<Record<TimelineCategory, number>>;
  events: TimelineEvent[];
}

export interface ProjectSnapshot {
  scannedAt: string;
  observation: ProjectObservation;
  health: ProjectHealth;
  timeline: ProjectTimeline;
  process: ProjectProcessAssessment;
}

function toProjectPath(value: string): string {
  return value.split(path.sep).join("/");
}

function artifactScope(relativePath: string): ArtifactScope {
  const firstSegment = relativePath.replace(/\\/g, "/").split("/")[0]?.toLowerCase();
  return new Set([".agents", ".claude", ".cursor", ".github", "skills"]).has(firstSegment)
    ? "support"
    : "project";
}

function artifactKind(relativePath: string): ArtifactKind {
  const lower = relativePath.toLowerCase().replace(/\\/g, "/");
  const name = path.basename(lower);
  const stem = name.replace(/\.[^.]+$/, "");
  const tokens = lower.split(/[\/\-_.\s]+/).filter(Boolean);

  // 한국어 파일명은 접미사가 붙어 한 토큰이 되는 경우가 많다(예: 기획안, 설계서).
  // 영어는 구분자로 단어가 나뉘므로 정확 일치를 유지하되, 한국어 어근은 부분 문자열로 잡는다.
  const hasKoreanRoot = (...roots: string[]) =>
    tokens.some((token) => roots.some((root) => token.includes(root)));

  if (/^readme(?:\.|$)/.test(name)) return "overview";
  if (
    ["prd", "product", "requirement", "requirements", "brief", "plan", "planning", "기획", "요구사항"].includes(stem)
    || tokens.some((token) => ["prd", "requirement", "requirements", "brief", "planning"].includes(token))
    || hasKoreanRoot("기획", "요구사항")
  ) return "planning";
  if (
    tokens.some((token) => ["adr", "architecture", "design", "system"].includes(token))
    || hasKoreanRoot("설계")
  ) return "architecture";
  if (
    tokens.some((token) => ["test", "tests", "qa", "quality", "validation"].includes(token))
    || hasKoreanRoot("검증")
  ) return "quality";
  if (
    tokens.some((token) => ["changelog", "release", "releases"].includes(token))
    || hasKoreanRoot("릴리스")
  ) return "release";
  return "document";
}

function isTestSource(relativePath: string): boolean {
  const lower = relativePath.toLowerCase();
  return /(^|\/)(__tests__|test|tests)(\/|$)/.test(lower)
    || /\.(spec|test)\.[^.]+$/.test(lower);
}

// git 저장소면 .gitignore로 무시되는 디렉토리를 모아 스캔에서 함께 제외한다.
// (git이 아니거나 실패하면 빈 집합 — 기존 하드코딩 목록만 적용, 하위 호환)
function collectIgnoredDirectories(root: string): Set<string> {
  const output = git(
    root,
    ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z"],
    true,
  );
  if (!output) return new Set();
  const ignored = new Set<string>();
  for (const entry of output.split("\0")) {
    if (!entry) continue;
    // git은 무시된 디렉토리를 뒤에 "/"를 붙여 알려준다. 그 경로를 정규화해 담는다.
    if (entry.endsWith("/")) ignored.add(entry.slice(0, -1).replace(/\\/g, "/"));
  }
  return ignored;
}

async function scanFiles(root: string, ignoredDirs: Set<string> = new Set()): Promise<FileObservation> {
  const artifacts: DiscoveredArtifact[] = [];
  let total = 0;
  let source = 0;
  let tests = 0;
  let config = 0;
  let truncated = false;

  async function visit(directory: string): Promise<void> {
    if (truncated) return;

    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (total >= MAX_FILES) {
        truncated = true;
        return;
      }

      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        const relativeDir = toProjectPath(path.relative(root, absolutePath));
        if (!IGNORED_DIRECTORIES.has(entry.name) && !ignoredDirs.has(relativeDir)) await visit(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;
      const lowerName = entry.name.toLowerCase();
      const relativePath = toProjectPath(path.relative(root, absolutePath));
      if (isGeneratedProjectBook(relativePath)) continue;

      total += 1;
      const extension = path.extname(entry.name).toLowerCase();
      if (SOURCE_EXTENSIONS.has(extension)) {
        source += 1;
        if (isTestSource(relativePath)) tests += 1;
      }
      if (CONFIG_NAMES.has(lowerName) || lowerName.endsWith(".config.js") || lowerName.endsWith(".config.ts")) {
        config += 1;
      }

      if (!DOCUMENT_EXTENSIONS.has(extension)) continue;

      try {
        const fileStat = await stat(absolutePath);
        artifacts.push({
          path: relativePath,
          name: entry.name,
          kind: artifactKind(relativePath),
          scope: artifactScope(relativePath),
          modifiedAt: fileStat.mtime.toISOString(),
          source: "filesystem",
        });
      } catch {
        // 파일이 스캔 중 사라진 경우 다음 파일을 계속 관찰한다.
      }
    }
  }

  await visit(root);
  artifacts.sort((left, right) => (
    left.scope.localeCompare(right.scope)
    || right.modifiedAt.localeCompare(left.modifiedAt)
    || left.path.localeCompare(right.path)
  ));
  return { total, source, tests, config, truncated, artifacts };
}

function git(root: string, args: string[], preserveWhitespace = false): string | null {
  try {
    const output = execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3_000,
    });
    return preserveWhitespace ? output || null : output.trim() || null;
  } catch {
    return null;
  }
}

function parseGitChanges(value: string | null): GitChange[] {
  if (!value) return [];
  const records = value.split("\0").filter(Boolean);
  const changes: GitChange[] = [];

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const status = record.slice(0, 2).trim() || "?";
    const filePath = record.slice(3);
    if (isObservedGitPath(filePath)) changes.push({ path: filePath, status });

    if (/[RC]/.test(record.slice(0, 2)) && records[index + 1]) index += 1;
  }

  return changes;
}

function parseGitCommits(value: string | null): GitCommit[] {
  if (!value) return [];

  return value
    .split("\u001e")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [header, ...pathLines] = record.split(/\r?\n/);
      const [hash, shortHash, author, authoredAt, ...subject] = header.split("\u001f");
      return {
        hash,
        shortHash,
        author: author ?? "",
        authoredAt,
        subject: subject.join("\u001f"),
        paths: pathLines
          .map((filePath) => filePath.trim())
          .filter((filePath) => Boolean(filePath) && isObservedGitPath(filePath)),
      };
    })
    .filter((commit) => Boolean(commit.hash && commit.shortHash && commit.authoredAt));
}

function scanGit(root: string): GitObservation {
  const isRepository = git(root, ["rev-parse", "--is-inside-work-tree"]) === "true";
  if (!isRepository) {
    return {
      isRepository: false,
      root: null,
      branch: null,
      head: null,
      changedFiles: [],
      recentCommits: [],
    };
  }

  return {
    isRepository: true,
    root: git(root, ["rev-parse", "--show-toplevel"]),
    branch: git(root, ["branch", "--show-current"]),
    head: git(root, ["rev-parse", "--short", "HEAD"]),
    changedFiles: parseGitChanges(git(
      root,
      ["status", "--porcelain=v1", "-z", "--untracked-files=normal"],
      true,
    )),
    recentCommits: parseGitCommits(git(root, [
      "log",
      "-n",
      String(MAX_GIT_COMMITS),
      "--date=iso-strict",
      "--pretty=format:%x1e%H%x1f%h%x1f%an%x1f%aI%x1f%s",
      "--name-only",
    ])),
  };
}

function documentSignal(
  artifacts: DiscoveredArtifact[],
  kind: ArtifactKind,
  options: {
    id: string;
    readyTitle: string;
    missingTitle: string;
    missingDetail: string;
    nextAction: string;
  },
): { passed: boolean; signal: ProjectSignal } {
  const matches = artifacts.filter((artifact) => artifact.scope === "project" && artifact.kind === kind);
  const passed = matches.length > 0;

  return {
    passed,
    signal: passed
      ? {
          id: options.id,
          level: "ready",
          title: options.readyTitle,
          detail: `${matches.length}개의 관련 문서를 자동으로 발견했습니다.`,
          evidence: [`발견 문서 ${matches.length}개`],
          sources: matches.slice(0, 3).map((artifact) => artifact.path),
          nextAction: "현재 문서가 프로젝트 상태와 일치하는지 주기적으로 확인하세요.",
        }
      : {
          id: options.id,
          level: "warning",
          title: options.missingTitle,
          detail: options.missingDetail,
          evidence: [`${kind} 분류 문서 0개`],
          sources: ["filesystem scan"],
          nextAction: options.nextAction,
        },
  };
}

export function evaluateProjectHealth(observation: ProjectObservation): ProjectHealth {
  const checks = [
    documentSignal(observation.files.artifacts.filter((artifact) => !artifact.path.includes("/")), "overview", {
      id: "project-overview",
      readyTitle: "프로젝트 소개 문서가 있습니다",
      missingTitle: "프로젝트 소개가 필요합니다",
      missingDetail: "팀원이 목적과 시작 방법을 확인할 README를 찾지 못했습니다.",
      nextAction: "루트 README에 프로젝트 목적, 실행 방법과 담당 범위를 작성하세요.",
    }),
    documentSignal(observation.files.artifacts, "planning", {
      id: "project-plan",
      readyTitle: "기획 기준을 찾았습니다",
      missingTitle: "기획 기준이 보이지 않습니다",
      missingDetail: "PRD, PRODUCT, 요구사항 또는 brief에 해당하는 문서를 찾지 못했습니다.",
      nextAction: "해결할 문제, 목표 사용자, MVP와 비목표를 한 문서에 고정하세요.",
    }),
    documentSignal(observation.files.artifacts, "architecture", {
      id: "project-architecture",
      readyTitle: "설계 기준을 찾았습니다",
      missingTitle: "설계 기준이 보이지 않습니다",
      missingDetail: "Architecture, Design 또는 ADR에 해당하는 문서를 찾지 못했습니다.",
      nextAction: "핵심 구성요소, 데이터 소유권과 중요한 결정을 짧게 기록하세요.",
    }),
  ];

  const gitPassed = observation.git.isRepository;
  checks.push({
    passed: gitPassed,
    signal: gitPassed
      ? {
          id: "git-repository",
          level: "ready",
          title: "Git 이력을 추적하고 있습니다",
          detail: `현재 branch는 ${observation.git.branch ?? "detached HEAD"}입니다.`,
          evidence: [observation.git.head ? `HEAD ${observation.git.head}` : "아직 commit 없음"],
          sources: [observation.git.root ?? "git"],
          nextAction: "의미 있는 변경 단위로 commit을 유지하세요.",
        }
      : {
          id: "git-repository",
          level: "warning",
          title: "변경 이력을 추적할 수 없습니다",
          detail: "현재 프로젝트 폴더에서 Git 저장소를 찾지 못했습니다.",
          evidence: ["git rev-parse 실패"],
          sources: ["git scan"],
          nextAction: "프로젝트가 새 작업이라면 Git 저장소를 초기화하세요.",
        },
  });

  const historyPassed = observation.git.recentCommits.length > 0;
  checks.push({
    passed: historyPassed,
    signal: historyPassed
      ? {
          id: "git-history",
          level: "ready",
          title: "최근 변경 이력이 있습니다",
          detail: `최근 commit ${observation.git.recentCommits.length}개를 읽었습니다.`,
          evidence: [observation.git.recentCommits[0].subject],
          sources: [`git:${observation.git.recentCommits[0].shortHash}`],
          nextAction: "주요 결정과 산출물 변경이 commit 메시지에 드러나는지 확인하세요.",
        }
      : {
          id: "git-history",
          level: "warning",
          title: "기록된 변경 이력이 없습니다",
          detail: "프로젝트 진행 과정을 설명할 commit을 찾지 못했습니다.",
          evidence: ["최근 commit 0개"],
          sources: ["git log"],
          nextAction: "현재 기준선을 첫 commit으로 남기세요.",
        },
  });

  if (observation.git.changedFiles.length > 0) {
    checks.push({
      passed: true,
      signal: {
        id: "working-tree",
        level: "attention",
        title: "검토할 작업 변경이 있습니다",
        detail: `아직 commit되지 않은 경로 ${observation.git.changedFiles.length}개를 발견했습니다.`,
        evidence: observation.git.changedFiles.slice(0, 3).map((change) => `${change.status} ${change.path}`),
        sources: ["git status"],
        nextAction: "변경 내용을 검토하고 의미 단위로 commit하거나 불필요한 파일을 제외하세요.",
      },
    });
  }

  const scoredChecks = checks.slice(0, 5);
  const passedChecks = scoredChecks.filter((check) => check.passed).length;
  const score = Math.round((passedChecks / scoredChecks.length) * 100);
  const status = score === 100 ? "on_track" : score >= 60 ? "attention" : "at_risk";
  const headline = status === "on_track"
    ? "프로젝트의 기본 방향과 기록이 연결되어 있습니다."
    : status === "attention"
      ? "몇 가지 기준을 보완하면 프로젝트 흐름이 더 선명해집니다."
      : "프로젝트 방향과 기록을 설명할 기준이 더 필요합니다.";

  const levelOrder: Record<SignalLevel, number> = { warning: 0, attention: 1, ready: 2 };
  const signals = checks
    .map((check) => check.signal)
    .sort((left, right) => levelOrder[left.level] - levelOrder[right.level]);

  return {
    status,
    score,
    passedChecks,
    totalChecks: scoredChecks.length,
    headline,
    signals,
  };
}

function artifactTimelineCategory(kind: ArtifactKind): TimelineCategory {
  const categories: Record<ArtifactKind, TimelineCategory> = {
    overview: "planning",
    planning: "planning",
    architecture: "design",
    quality: "quality",
    release: "delivery",
    document: "documentation",
  };
  return categories[kind];
}

function commitTimelineCategory(subject: string): TimelineCategory {
  const type = subject.match(/^([a-z]+)(?:\([^)]+\))?!?:/i)?.[1]?.toLowerCase();
  if (type === "feat" || type === "refactor" || type === "perf") return "implementation";
  if (type === "fix" || type === "revert") return "issue";
  if (type === "test") return "quality";
  if (type === "release") return "delivery";
  if (type === "docs") return "documentation";
  if (type === "build" || type === "ci" || type === "chore") return "operations";
  if (type === "plan" || type === "product") return "planning";
  if (type === "design" || type === "adr") return "design";
  if (/^(fix|fixed|resolve|resolved|hotfix)\b/i.test(subject)) return "issue";
  if (/^(test|verify|validate)\b/i.test(subject)) return "quality";
  if (/^(docs?|document|readme)\b|^(update|refresh)\b.*\b(docs?|readme)\b/i.test(subject)) return "documentation";
  if (/^(release|publish|deploy)\b/i.test(subject)) return "delivery";
  if (/^(build|ci|chore)\b|\b(codeowners?|dockerfile|workflow)\b/i.test(subject)) return "operations";
  // 의존성·저장소 유지보수 성격의 흔한 동사를 보수적으로 운영으로 본다.
  if (/^(bump|upgrade|downgrade|pin|merge)\b/i.test(subject) || /^merge (pull request|branch|remote)\b/i.test(subject)) return "operations";
  if (/\b(design|architecture|adr)\b/i.test(subject)) return "design";
  // 명시적인 코드 변경 동사에 한해 기능으로 본다. 의미가 모호한 제목은 그대로 change로 둔다.
  if (/^(add|implement|introduce|migrate|extract|improve|restore|support|enable|remove|delete|rename|move|replace|refactor|rework|simplify|clean|cleanup|handle|prevent|wire|polish|tweak|revamp)\b/i.test(subject)) return "implementation";
  return "change";
}

export function buildProjectTimeline(observation: ProjectObservation): ProjectTimeline {
  const changedPaths = new Set(observation.git.changedFiles.map((change) => change.path));
  const projectArtifacts = observation.files.artifacts.filter((artifact) => artifact.scope === "project");
  const workingArtifacts = observation.git.isRepository
    ? projectArtifacts.filter((artifact) => changedPaths.has(artifact.path))
    : projectArtifacts;

  const artifactEvents: TimelineEvent[] = workingArtifacts.map((artifact) => ({
    id: `artifact:${artifact.path}`,
    type: "artifact",
    category: artifactTimelineCategory(artifact.kind),
    occurredAt: artifact.modifiedAt,
    title: `${artifact.name} 작업 중`,
    detail: observation.git.isRepository
      ? "아직 commit되지 않은 문서 변경을 파일에서 발견했습니다."
      : "Git 이력이 없어 파일의 현재 수정 시각을 기준으로 표시합니다.",
    source: "filesystem",
    reference: artifact.path,
    relatedArtifacts: [artifact.path],
  }));

  const artifactPaths = new Set(projectArtifacts.map((artifact) => artifact.path));
  const commitEvents: TimelineEvent[] = observation.git.recentCommits.map((commit) => {
    const relatedArtifacts = commit.paths.filter((filePath) => artifactPaths.has(filePath));
    return {
      id: `commit:${commit.hash}`,
      type: "commit",
      category: commitTimelineCategory(commit.subject),
      occurredAt: commit.authoredAt,
      title: commit.subject,
      detail: relatedArtifacts.length > 0
        ? `Git commit에 문서 산출물 ${relatedArtifacts.length}개가 포함되어 있습니다.`
        : `Git commit으로 기록된 변경 경로 ${commit.paths.length}개입니다.`,
      source: "git",
      reference: commit.shortHash,
      relatedArtifacts,
      author: commit.author,
    };
  });

  const allEvents = [...artifactEvents, ...commitEvents].sort((left, right) => {
    const timeDifference = Date.parse(right.occurredAt) - Date.parse(left.occurredAt);
    return timeDifference || left.id.localeCompare(right.id);
  });

  return {
    events: allEvents.slice(0, MAX_TIMELINE_EVENTS),
    total: allEvents.length,
    truncated: allEvents.length > MAX_TIMELINE_EVENTS,
  };
}

export function groupTimelineByDay(events: TimelineEvent[]): TimelineDay[] {
  const buckets = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    // ISO 시각의 UTC 날짜 부분을 하루 단위 키로 쓴다.
    const date = event.occurredAt.slice(0, 10);
    const bucket = buckets.get(date);
    if (bucket) bucket.push(event);
    else buckets.set(date, [event]);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, dayEvents]) => {
      const ordered = [...dayEvents].sort((left, right) => {
        const timeDifference = Date.parse(right.occurredAt) - Date.parse(left.occurredAt);
        return timeDifference || left.id.localeCompare(right.id);
      });
      const categoryCounts: Partial<Record<TimelineCategory, number>> = {};
      for (const event of ordered) {
        categoryCounts[event.category] = (categoryCounts[event.category] ?? 0) + 1;
      }
      return { date, total: ordered.length, categoryCounts, events: ordered };
    });
}

export async function scanProject(root: string, now = new Date()): Promise<ProjectSnapshot> {
  const resolvedRoot = path.resolve(root);
  const ignoredDirs = collectIgnoredDirectories(resolvedRoot);
  const [files, gitObservation] = await Promise.all([
    scanFiles(resolvedRoot, ignoredDirs),
    Promise.resolve(scanGit(resolvedRoot)),
  ]);
  const observation = { files, git: gitObservation };

  return {
    scannedAt: now.toISOString(),
    observation,
    health: evaluateProjectHealth(observation),
    timeline: buildProjectTimeline(observation),
    process: assessProjectProcess(observation),
  };
}
