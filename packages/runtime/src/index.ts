import { readProjectIdentity, scanProject } from "@beacon/core";
import { renderDashboard } from "@beacon/dashboard";
import { createServer, type Server } from "node:http";
import { ProjectHistoryStore } from "./historyStore.js";

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
