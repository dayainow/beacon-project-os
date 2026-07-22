import { readProjectIdentity, readProjectJourney, scanProject } from "@beacon/core";
import { renderDashboard } from "@beacon/dashboard";
import { readFile, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { ProjectHistoryStore } from "./historyStore.js";

const VIEWABLE_TEXT_EXTENSIONS = new Set([".md", ".mdx", ".txt"]);
const MAX_VIEWABLE_BYTES = 512 * 1024;

// 프로젝트 루트 안의 텍스트 문서만 안전하게 읽는다. 경로 이탈·내부 경로·바이너리를 차단한다.
async function readViewableFile(
  root: string,
  relativePath: string,
): Promise<{ ok: true; content: string } | { ok: false; status: number; error: string }> {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, target);
  // 루트 밖으로 나가거나 절대경로면 거부 (path traversal 차단).
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { ok: false, status: 403, error: "path_out_of_project" };
  }
  const normalized = relative.split(path.sep).join("/");
  if (normalized === ".beacon" || normalized.startsWith(".beacon/") || normalized === ".git" || normalized.startsWith(".git/")) {
    return { ok: false, status: 403, error: "internal_path" };
  }
  if (!VIEWABLE_TEXT_EXTENSIONS.has(path.extname(target).toLowerCase())) {
    return { ok: false, status: 415, error: "not_a_text_document" };
  }
  try {
    const info = await stat(target);
    if (!info.isFile()) return { ok: false, status: 404, error: "not_a_file" };
    if (info.size > MAX_VIEWABLE_BYTES) return { ok: false, status: 413, error: "file_too_large" };
    return { ok: true, content: await readFile(target, "utf8") };
  } catch {
    return { ok: false, status: 404, error: "file_not_found" };
  }
}

export { ProjectHistoryStore } from "./historyStore.js";
export type { ProjectHistory, SnapshotRecordResult, StoredProjectChange } from "./historyStore.js";

export interface StartRuntimeOptions {
  root: string;
  port?: number;
  host?: string;
}

export interface BeaconRuntime {
  server: Server;
  url: string;
}

function sendJson(response: import("node:http").ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(`${JSON.stringify(value)}\n`);
}

export async function startBeaconRuntime({
  root,
  port = 4300,
  host = "127.0.0.1",
}: StartRuntimeOptions): Promise<BeaconRuntime> {
  await readProjectIdentity(root);
  const historyStore = new ProjectHistoryStore(root);

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? host}`);

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    if (requestUrl.pathname === "/api/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (requestUrl.pathname === "/api/identity") {
      try {
        sendJson(response, 200, await readProjectIdentity(root));
      } catch (error) {
        sendJson(response, 500, {
          error: "identity_unavailable",
          message: error instanceof Error ? error.message : "unknown error",
        });
      }
      return;
    }

    if (requestUrl.pathname === "/api/snapshot") {
      try {
        const snapshot = await scanProject(root);
        sendJson(response, 200, {
          ...snapshot,
          persistence: historyStore.record(snapshot),
        });
      } catch (error) {
        sendJson(response, 500, {
          error: "snapshot_unavailable",
          message: error instanceof Error ? error.message : "unknown error",
        });
      }
      return;
    }

    if (requestUrl.pathname === "/api/journey") {
      try {
        sendJson(response, 200, await readProjectJourney(root));
      } catch (error) {
        sendJson(response, 500, {
          error: "journey_unavailable",
          message: error instanceof Error ? error.message : "unknown error",
        });
      }
      return;
    }

    if (requestUrl.pathname === "/api/history") {
      try {
        const requestedLimit = Number(requestUrl.searchParams.get("limit") ?? 100);
        sendJson(response, 200, historyStore.history(requestedLimit));
      } catch (error) {
        sendJson(response, 500, {
          error: "history_unavailable",
          message: error instanceof Error ? error.message : "unknown error",
        });
      }
      return;
    }

    if (requestUrl.pathname === "/api/file") {
      const requestedPath = requestUrl.searchParams.get("path") ?? "";
      if (!requestedPath) {
        sendJson(response, 400, { error: "path_required" });
        return;
      }
      const result = await readViewableFile(root, requestedPath);
      if (result.ok) sendJson(response, 200, { path: requestedPath, content: result.content });
      else sendJson(response, result.status, { error: result.error });
      return;
    }

    if (requestUrl.pathname === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(renderDashboard());
      return;
    }

    sendJson(response, 404, { error: "not_found" });
  });
  server.once("close", () => historyStore.close());

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, host, () => {
        server.off("error", reject);
        resolve();
      });
    });
  } catch (error) {
    historyStore.close();
    throw error;
  }

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Beacon runtime 주소를 확인할 수 없습니다.");
  }

  return { server, url: `http://${host}:${address.port}` };
}
