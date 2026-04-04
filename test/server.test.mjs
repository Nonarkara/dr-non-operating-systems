import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

import { createRequestHandler } from "../src/create-server.js";
import { createRequestContext } from "../src/lib/http.js";

function makeLogger() {
  return {
    info() {},
    warn() {},
    error() {}
  };
}

function createMockResponse() {
  return {
    headers: {},
    statusCode: null,
    body: "",
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    writeHead(statusCode, headers = {}) {
      this.statusCode = statusCode;

      for (const [name, value] of Object.entries(headers)) {
        this.headers[name.toLowerCase()] = value;
      }
    },
    end(body = "") {
      this.body = body;
    }
  };
}

async function dispatch(handler, {
  method = "GET",
  url = "/",
  headers = {},
  body = "",
  ip = "127.0.0.1"
} = {}) {
  const request = Readable.from(body ? [Buffer.from(body)] : []);
  request.method = method;
  request.url = url;
  request.headers = headers;
  request.socket = { remoteAddress: ip };

  const response = createMockResponse();
  await handler(request, response);
  return response;
}

test("admin scan route rejects unauthenticated requests", async () => {
  const handler = createRequestHandler({
    config: {
      publicDir: process.cwd(),
      auth: { adminBearerToken: "secret" },
      limits: { beaconPerMinute: 10, beaconMaxBytes: 4096, adminMaxBytes: 4096 }
    },
    service: {},
    logger: makeLogger(),
    createRequestContext
  });

  const response = await dispatch(handler, {
    method: "POST",
    url: "/api/admin/scans/run",
    headers: { "content-type": "application/json", host: "localhost" },
    body: JSON.stringify({})
  });

  assert.equal(response.statusCode, 401);
});

test("beacon route validates and rate limits", async () => {
  let beaconCalls = 0;

  const handler = createRequestHandler({
    config: {
      publicDir: process.cwd(),
      auth: { adminBearerToken: "secret" },
      limits: { beaconPerMinute: 2, beaconMaxBytes: 4096, adminMaxBytes: 4096 }
    },
    service: {
      async recordBeacon() {
        beaconCalls += 1;
        return { status: "ok" };
      }
    },
    logger: makeLogger(),
    createRequestContext
  });

  const invalid = await dispatch(handler, {
    method: "POST",
    url: "/api/beacon",
    headers: { "content-type": "application/json", host: "localhost" },
    body: JSON.stringify({ responseMs: "fast" })
  });

  assert.equal(invalid.statusCode, 400);

  const first = await dispatch(handler, {
    method: "POST",
    url: "/api/beacon",
    headers: { "content-type": "application/json", host: "localhost" },
    body: JSON.stringify({ projectId: "ops" })
  });

  assert.equal(first.statusCode, 200);

  const second = await dispatch(handler, {
    method: "POST",
    url: "/api/beacon",
    headers: { "content-type": "application/json", host: "localhost" },
    body: JSON.stringify({ projectId: "ops" })
  });

  assert.equal(second.statusCode, 429);
  assert.equal(beaconCalls, 1);
});
