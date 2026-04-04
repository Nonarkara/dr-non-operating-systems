import { randomUUID } from "node:crypto";

export function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

export function sendText(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "text/plain; charset=utf-8",
    ...extraHeaders
  });
  response.end(body);
}

export function sendError(response, statusCode, code, message, details = {}) {
  sendJson(response, statusCode, {
    error: {
      code,
      message,
      ...details
    }
  });
}

export function getBearerToken(request) {
  const header = request.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

export function getClientIp(request) {
  const forwarded = request.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.socket?.remoteAddress || null;
}

export function createRequestContext(request) {
  return {
    requestId: request.headers["x-request-id"] || randomUUID(),
    startedAt: Date.now(),
    method: request.method || "GET",
    ip: getClientIp(request),
    userAgent: request.headers["user-agent"] || "",
    path: request.url || "/"
  };
}

export async function readRawBody(request, maxBytes) {
  let totalBytes = 0;
  const chunks = [];

  for await (const chunk of request) {
    totalBytes += chunk.length;

    if (totalBytes > maxBytes) {
      const error = new Error(`Body exceeded ${maxBytes} bytes`);
      error.code = "BODY_TOO_LARGE";
      throw error;
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

export async function readJsonBody(request, maxBytes) {
  const raw = await readRawBody(request, maxBytes);

  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    error.code = "INVALID_JSON";
    throw error;
  }
}

export function methodNotAllowed(response, allow) {
  sendError(response, 405, "METHOD_NOT_ALLOWED", "Method not allowed.", { allow });
}
