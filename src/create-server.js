import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

import { MIME_TYPES } from "./data/constants.js";
import {
  getBearerToken,
  methodNotAllowed,
  readJsonBody,
  sendError,
  sendJson,
  sendText
} from "./lib/http.js";
import {
  BeaconPayloadSchema,
  PublishSnapshotPayloadSchema,
  ScanRunPayloadSchema,
  TriggerClaimPayloadSchema,
  TriggerResolvePayloadSchema
} from "./lib/validation.js";

function safeFilePath(publicDir, pathname) {
  let decodedPathname;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const requested = decodedPathname === "/" ? "index.html" : decodedPathname.replace(/^\/+/, "");
  const normalized = normalize(requested);

  if (normalized.startsWith("..") || normalized.startsWith("/")) {
    return null;
  }

  const fullPath = join(publicDir, normalized);
  return fullPath.startsWith(publicDir) ? fullPath : null;
}

function validateSchema(schema, payload, response) {
  const result = schema.validate(payload);

  if (!result.ok) {
    sendError(response, 400, "INVALID_PAYLOAD", result.errors.join(" "));
    return null;
  }

  return result.value;
}

export function createBeaconRateLimiter({ limitPerMinute }) {
  const buckets = new Map();

  return {
    allow(ip) {
      const minuteKey = `${ip || "unknown"}:${Math.floor(Date.now() / 60_000)}`;
      const current = buckets.get(minuteKey) || 0;

      buckets.set(minuteKey, current + 1);

      if (buckets.size > 2000) {
        const cutoff = Math.floor(Date.now() / 60_000) - 5;

        for (const key of buckets.keys()) {
          const [, minute] = key.split(":");

          if (Number(minute) < cutoff) {
            buckets.delete(key);
          }
        }
      }

      return current < limitPerMinute;
    }
  };
}

function ensureAdmin(request, response, config) {
  if (!config.auth.adminBearerToken) {
    sendError(response, 503, "ADMIN_AUTH_NOT_CONFIGURED", "Admin auth is not configured.");
    return false;
  }

  const token = getBearerToken(request);

  if (!token || token !== config.auth.adminBearerToken) {
    sendError(response, 401, "UNAUTHORIZED", "A valid bearer token is required.");
    return false;
  }

  return true;
}

async function serveStatic(publicDir, pathname, response) {
  const fullPath = safeFilePath(publicDir, pathname);

  if (!fullPath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const { readFile } = await import("node:fs/promises");
    const file = await readFile(fullPath);
    response.writeHead(200, {
      "cache-control": pathname === "/" ? "no-store" : "public, max-age=300",
      "content-type": MIME_TYPES[extname(fullPath)] || "application/octet-stream"
    });
    response.end(file);
  } catch {
    if (pathname !== "/" && pathname !== "/index.html") {
      sendText(response, 404, "Not found");
      return;
    }

    sendText(response, 500, "Unable to load dashboard");
  }
}

export function createRequestHandler({ config, service, logger, createRequestContext }) {
  const beaconRateLimiter = createBeaconRateLimiter({
    limitPerMinute: config.limits.beaconPerMinute
  });

  return async (request, response) => {
    const context = createRequestContext(request);
    response.setHeader("x-request-id", context.requestId);

    const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);

    logger.info("http.request", {
      requestId: context.requestId,
      method: context.method,
      path: url.pathname
    });

    try {
      if (url.pathname === "/api/health") {
        sendJson(response, 200, await service.getPublicHealth(), { "x-request-id": context.requestId });
        return;
      }

      if (url.pathname === "/api/dashboard") {
        sendJson(response, 200, await service.getPublicDashboard(), { "x-request-id": context.requestId });
        return;
      }

      if (url.pathname === "/api/mentions") {
        sendJson(response, 200, await service.getPublicMentions(), { "x-request-id": context.requestId });
        return;
      }

      if (url.pathname === "/api/analytics") {
        sendJson(response, 200, service.getAnalyticsSummary(), { "x-request-id": context.requestId });
        return;
      }

      if (url.pathname === "/api/alerts") {
        sendJson(response, 200, {
          active: service.getActiveIncidents(),
          recent: service.getRecentAlerts(50)
        }, { "x-request-id": context.requestId });
        return;
      }

      if (url.pathname === "/api/triggers" && request.method === "GET") {
        const status = url.searchParams.get("status") || "open";
        sendJson(response, 200, { triggers: service.getTriggers(status) }, { "x-request-id": context.requestId });
        return;
      }

      if (url.pathname === "/api/beacon") {
        if (request.method !== "POST") {
          methodNotAllowed(response, "POST");
          return;
        }

        if (!beaconRateLimiter.allow(context.ip)) {
          sendError(response, 429, "RATE_LIMITED", "Beacon rate limit exceeded.");
          return;
        }

        let payload;

        try {
          payload = await readJsonBody(request, config.limits.beaconMaxBytes);
        } catch (error) {
          const code = error.code === "BODY_TOO_LARGE" ? 413 : 400;
          sendError(response, code, error.code || "INVALID_BODY", error.message);
          return;
        }

        const validated = validateSchema(BeaconPayloadSchema, payload, response);

        if (!validated) {
          return;
        }

        sendJson(response, 200, await service.recordBeacon(validated, context), { "x-request-id": context.requestId });
        return;
      }

      if (url.pathname === "/api/snapshots") {
        sendJson(response, 200, await service.getSnapshotCommits(), { "x-request-id": context.requestId });
        return;
      }

      const snapshotShaMatch = url.pathname.match(/^\/api\/snapshots\/([a-f0-9]{7,40})$/);

      if (snapshotShaMatch) {
        sendJson(response, 200, await service.getHistoricalSnapshot(snapshotShaMatch[1]), {
          "x-request-id": context.requestId
        });
        return;
      }

      if (
        url.pathname === "/api/scheduler" ||
        /^\/api\/triggers\/[^/]+\/(claim|resolve)$/.test(url.pathname)
      ) {
        sendError(
          response,
          410,
          "DEPRECATED_ROUTE",
          "This route is deprecated. Use the authenticated /api/admin/* endpoints."
        );
        return;
      }

      if (url.pathname === "/api/admin/scheduler") {
        if (!ensureAdmin(request, response, config)) {
          return;
        }

        sendJson(response, 200, service.getAdminSchedulerState(), { "x-request-id": context.requestId });
        return;
      }

      if (url.pathname === "/api/admin/scans/run") {
        if (request.method !== "POST") {
          methodNotAllowed(response, "POST");
          return;
        }

        if (!ensureAdmin(request, response, config)) {
          return;
        }

        let payload;

        try {
          payload = await readJsonBody(request, config.limits.adminMaxBytes);
        } catch (error) {
          const code = error.code === "BODY_TOO_LARGE" ? 413 : 400;
          sendError(response, code, error.code || "INVALID_BODY", error.message);
          return;
        }

        const validated = validateSchema(ScanRunPayloadSchema, payload, response);

        if (!validated) {
          return;
        }

        const result = await service.runScanJob({
          actor: "admin-api",
          source: "admin-api",
          requestId: context.requestId,
          force: validated.force,
          publish: validated.publish,
          reason: validated.reason
        });

        sendJson(response, 200, {
          ok: true,
          job: result.job,
          published: result.published,
          preservedPreviousSnapshot: result.preservedPreviousSnapshot,
          generatedAt: result.payload.generatedAt
        }, { "x-request-id": context.requestId });
        return;
      }

      if (url.pathname === "/api/admin/snapshots/publish") {
        if (request.method !== "POST") {
          methodNotAllowed(response, "POST");
          return;
        }

        if (!ensureAdmin(request, response, config)) {
          return;
        }

        let payload;

        try {
          payload = await readJsonBody(request, config.limits.adminMaxBytes);
        } catch (error) {
          const code = error.code === "BODY_TOO_LARGE" ? 413 : 400;
          sendError(response, code, error.code || "INVALID_BODY", error.message);
          return;
        }

        const validated = validateSchema(PublishSnapshotPayloadSchema, payload, response);

        if (!validated) {
          return;
        }

        const snapshot = await service.publishStagedSnapshot({
          actor: "admin-api",
          source: "admin-api",
          requestId: context.requestId,
          reason: validated.reason
        });

        sendJson(response, 200, {
          ok: true,
          generatedAt: snapshot.generatedAt,
          snapshotMeta: snapshot.snapshotMeta
        }, { "x-request-id": context.requestId });
        return;
      }

      const claimMatch = url.pathname.match(/^\/api\/admin\/triggers\/([^/]+)\/claim$/);

      if (claimMatch) {
        if (request.method !== "POST") {
          methodNotAllowed(response, "POST");
          return;
        }

        if (!ensureAdmin(request, response, config)) {
          return;
        }

        let payload;

        try {
          payload = await readJsonBody(request, config.limits.adminMaxBytes);
        } catch (error) {
          const code = error.code === "BODY_TOO_LARGE" ? 413 : 400;
          sendError(response, code, error.code || "INVALID_BODY", error.message);
          return;
        }

        const validated = validateSchema(TriggerClaimPayloadSchema, payload, response);

        if (!validated) {
          return;
        }

        sendJson(response, 200, {
          ok: true,
          trigger: await service.claimTrigger(claimMatch[1], validated.claimedBy, "admin-api")
        }, { "x-request-id": context.requestId });
        return;
      }

      const resolveMatch = url.pathname.match(/^\/api\/admin\/triggers\/([^/]+)\/resolve$/);

      if (resolveMatch) {
        if (request.method !== "POST") {
          methodNotAllowed(response, "POST");
          return;
        }

        if (!ensureAdmin(request, response, config)) {
          return;
        }

        let payload;

        try {
          payload = await readJsonBody(request, config.limits.adminMaxBytes);
        } catch (error) {
          const code = error.code === "BODY_TOO_LARGE" ? 413 : 400;
          sendError(response, code, error.code || "INVALID_BODY", error.message);
          return;
        }

        const validated = validateSchema(TriggerResolvePayloadSchema, payload, response);

        if (!validated) {
          return;
        }

        sendJson(response, 200, {
          ok: true,
          trigger: await service.resolveTrigger(resolveMatch[1], validated.resolution, "admin-api")
        }, { "x-request-id": context.requestId });
        return;
      }

      await serveStatic(config.publicDir, url.pathname, response);
    } catch (error) {
      logger.error("http.request_failed", {
        requestId: context.requestId,
        method: context.method,
        path: url.pathname,
        message: error.message
      });

      if (error.code === "TRIGGER_NOT_FOUND") {
        sendError(response, 404, "TRIGGER_NOT_FOUND", error.message);
        return;
      }

      if (error.message === "Snapshot file unavailable") {
        sendError(response, 503, "SNAPSHOT_UNAVAILABLE", error.message);
        return;
      }

      sendError(response, 500, "INTERNAL_ERROR", error.message);
    }
  };
}

export function createAppServer({ config, service, logger, createRequestContext }) {
  return createServer(createRequestHandler({ config, service, logger, createRequestContext }));
}
