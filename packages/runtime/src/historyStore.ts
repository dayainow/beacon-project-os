import {
  BEACON_DIRECTORY,
  diffProjectSnapshots,
  type ProjectChange,
  type ProjectSnapshot,
  type TimelineEvent,
} from "@beacon/core";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export interface SnapshotRecordResult {
  snapshotId: number;
  recorded: boolean;
  baseline: boolean;
  changes: ProjectChange[];
  snapshotCount: number;
  changeCount: number;
  timelineCount: number;
}

export interface StoredProjectChange extends ProjectChange {
  sequence: number;
  snapshotId: number;
}

export interface ProjectHistory {
  snapshotCount: number;
  changeCount: number;
  timelineCount: number;
  latestSnapshotAt: string | null;
  changes: StoredProjectChange[];
  timeline: TimelineEvent[];
}

interface SnapshotRow {
  id: number;
  fingerprint: string;
  snapshot_json: string;
}

function fingerprint(snapshot: ProjectSnapshot): string {
  return createHash("sha256")
    .update(JSON.stringify(snapshot.observation))
    .digest("hex");
}

function numberValue(value: unknown): number {
  return typeof value === "bigint" ? Number(value) : Number(value ?? 0);
}

export class ProjectHistoryStore {
  readonly databasePath: string;
  private readonly database: DatabaseSync;
  private closed = false;

  constructor(root: string, databasePath = path.join(path.resolve(root), BEACON_DIRECTORY, "beacon.db")) {
    this.databasePath = databasePath;
    mkdirSync(path.dirname(databasePath), { recursive: true });
    const ignorePath = path.join(path.resolve(root), BEACON_DIRECTORY, ".gitignore");
    const existingIgnore = existsSync(ignorePath) ? readFileSync(ignorePath, "utf8") : "";
    if (!existingIgnore.split(/\r?\n/).includes("beacon.db*")) {
      const prefix = existingIgnore && !existingIgnore.endsWith("\n") ? `${existingIgnore}\n` : existingIgnore;
      writeFileSync(ignorePath, `${prefix}beacon.db*\n`, "utf8");
    }
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA user_version = 1;

      CREATE TABLE IF NOT EXISTS project_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        captured_at TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        snapshot_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS project_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id INTEGER NOT NULL REFERENCES project_snapshots(id),
        detected_at TEXT NOT NULL,
        kind TEXT NOT NULL,
        entity TEXT NOT NULL,
        reference TEXT NOT NULL,
        change_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_key TEXT NOT NULL UNIQUE,
        occurred_at TEXT NOT NULL,
        occurred_at_ms INTEGER NOT NULL,
        event_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS project_changes_snapshot_idx
        ON project_changes(snapshot_id, id);
      CREATE INDEX IF NOT EXISTS timeline_events_time_idx
        ON timeline_events(occurred_at_ms DESC, id DESC);
    `);
  }

  record(snapshot: ProjectSnapshot): SnapshotRecordResult {
    const nextFingerprint = fingerprint(snapshot);
    const latestRow = this.database.prepare(`
      SELECT id, fingerprint, snapshot_json
      FROM project_snapshots
      ORDER BY id DESC
      LIMIT 1
    `).get() as SnapshotRow | undefined;

    if (latestRow?.fingerprint === nextFingerprint) {
      const counts = this.counts();
      return {
        snapshotId: latestRow.id,
        recorded: false,
        baseline: false,
        changes: [],
        ...counts,
      };
    }

    const previous = latestRow
      ? JSON.parse(latestRow.snapshot_json) as ProjectSnapshot
      : null;
    const changes = diffProjectSnapshots(previous, snapshot);

    this.database.exec("BEGIN IMMEDIATE");
    let snapshotId = 0;
    try {
      const inserted = this.database.prepare(`
        INSERT INTO project_snapshots (captured_at, fingerprint, snapshot_json)
        VALUES (?, ?, ?)
      `).run(snapshot.scannedAt, nextFingerprint, JSON.stringify(snapshot));
      snapshotId = numberValue(inserted.lastInsertRowid);

      const insertChange = this.database.prepare(`
        INSERT INTO project_changes (
          snapshot_id, detected_at, kind, entity, reference, change_json
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const change of changes) {
        insertChange.run(
          snapshotId,
          change.detectedAt,
          change.kind,
          change.entity,
          change.reference,
          JSON.stringify(change),
        );
      }

      const insertTimeline = this.database.prepare(`
        INSERT OR IGNORE INTO timeline_events (
          event_key, occurred_at, occurred_at_ms, event_json
        ) VALUES (?, ?, ?, ?)
      `);
      for (const event of snapshot.timeline.events) {
        const eventKey = event.type === "commit" ? event.id : `${event.id}:${event.occurredAt}`;
        insertTimeline.run(
          eventKey,
          event.occurredAt,
          Date.parse(event.occurredAt),
          JSON.stringify(event),
        );
      }

      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }

    return {
      snapshotId,
      recorded: true,
      baseline: previous === null,
      changes,
      ...this.counts(),
    };
  }

  history(limit = 100): ProjectHistory {
    const boundedLimit = Math.max(1, Math.min(200, Math.trunc(limit) || 100));
    const counts = this.counts();
    const latest = this.database.prepare(`
      SELECT captured_at
      FROM project_snapshots
      ORDER BY id DESC
      LIMIT 1
    `).get() as { captured_at: string } | undefined;

    const changes = this.database.prepare(`
      SELECT id, snapshot_id, change_json
      FROM project_changes
      ORDER BY id DESC
      LIMIT ?
    `).all(boundedLimit).map((row) => ({
      ...JSON.parse(String(row.change_json)) as ProjectChange,
      sequence: numberValue(row.id),
      snapshotId: numberValue(row.snapshot_id),
    }));

    const timeline = this.database.prepare(`
      SELECT event_json
      FROM timeline_events
      ORDER BY occurred_at_ms DESC, id DESC
      LIMIT ?
    `).all(boundedLimit).map((row) => JSON.parse(String(row.event_json)) as TimelineEvent);

    return {
      ...counts,
      latestSnapshotAt: latest?.captured_at ?? null,
      changes,
      timeline,
    };
  }

  close(): void {
    if (this.closed) return;
    this.database.close();
    this.closed = true;
  }

  private counts(): Pick<ProjectHistory, "snapshotCount" | "changeCount" | "timelineCount"> {
    const row = this.database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM project_snapshots) AS snapshot_count,
        (SELECT COUNT(*) FROM project_changes) AS change_count,
        (SELECT COUNT(*) FROM timeline_events) AS timeline_count
    `).get();

    return {
      snapshotCount: numberValue(row?.snapshot_count),
      changeCount: numberValue(row?.change_count),
      timelineCount: numberValue(row?.timeline_count),
    };
  }
}
