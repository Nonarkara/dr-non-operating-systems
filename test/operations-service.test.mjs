import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createConfig } from "../src/config.js";
import { TARGETS } from "../src/data/catalog.js";
import { FileRepository } from "../src/repositories/files.js";
import { SupabaseRepository } from "../src/repositories/supabase.js";
import { OperationsService } from "../src/services/operations-service.js";

function makeLogger() {
  return {
    info() {},
    warn() {},
    error() {}
  };
}

function makeFetchStub() {
  let failingTarget = null;

  const fetchStub = async (url) => {
    const href = typeof url === "string" ? url : url.toString();

    if (href.includes("api.github.com/users/Nonarkara/repos")) {
      return Response.json([
        {
          fork: false,
          has_pages: true,
          language: "JavaScript",
          name: "dr-non-operating-systems",
          description: "ops",
          pushed_at: "2026-04-04T00:00:00.000Z",
          updated_at: "2026-04-04T00:00:00.000Z",
          html_url: "https://github.com/Nonarkara/dr-non-operating-systems"
        }
      ]);
    }

    if (href.includes("api.github.com/users/Nonarkara")) {
      return Response.json({
        created_at: "2020-01-01T00:00:00.000Z",
        followers: 10,
        location: "Bangkok",
        login: "Nonarkara",
        name: "Dr Non",
        public_repos: 100,
        updated_at: "2026-04-04T00:00:00.000Z",
        html_url: "https://github.com/Nonarkara"
      });
    }

    if (href.includes("api.github.com/repos/")) {
      const name = href.split("/repos/")[1];
      return Response.json({
        default_branch: "main",
        description: `${name} description`,
        full_name: name,
        has_pages: true,
        language: "JavaScript",
        pushed_at: "2026-04-04T00:00:00.000Z",
        updated_at: "2026-04-04T00:00:00.000Z",
        html_url: `https://github.com/${name}`
      });
    }

    if (href.includes("news.google.com/rss/search")) {
      return new Response(
        `<?xml version="1.0"?>
          <rss><channel>
            <item>
              <title>Dr Non builds again - Example News</title>
              <link>https://example.com/story</link>
              <pubDate>Fri, 04 Apr 2026 00:00:00 GMT</pubDate>
              <source>Example News</source>
            </item>
          </channel></rss>`,
        { headers: { "content-type": "application/xml" } }
      );
    }

    if (failingTarget && href.startsWith(failingTarget)) {
      return new Response("<html><title>Error</title></html>", { status: 500, headers: { "content-type": "text/html" } });
    }

    return new Response("<html><title>Healthy</title></html>", {
      status: 200,
      headers: { "content-type": "text/html", server: "render" }
    });
  };

  return {
    fetchStub,
    failTarget(url) {
      failingTarget = url;
    }
  };
}

test("scan job publishes snapshot and avoids duplicate down alerts on repeat failure", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "ops-radar-"));
  await mkdir(join(rootDir, "public", "data"), { recursive: true });

  const { fetchStub, failTarget } = makeFetchStub();
  const config = createConfig({
    env: { NO_LISTEN: "1" },
    rootDir
  });
  const logger = makeLogger();
  const service = new OperationsService({
    config,
    logger,
    fileRepository: new FileRepository(config),
    supabaseRepository: new SupabaseRepository(config, { fetchFn: fetchStub, logger }),
    fetchFn: fetchStub,
    environmentIssues: []
  });

  await service.initialize();

  const first = await service.runScanJob({
    actor: "test",
    source: "test",
    publish: true,
    force: true
  });

  assert.equal(first.published, true);
  assert.equal(first.payload.targets.length, TARGETS.length);

  failTarget(TARGETS[1].url);
  const second = await service.runScanJob({
    actor: "test",
    source: "test",
    publish: true,
    force: true
  });

  assert.equal(second.payload.targets[1].health.code, "error");
  assert.equal(service.alertsData.alerts.length, 1);

  const third = await service.runScanJob({
    actor: "test",
    source: "test",
    publish: true,
    force: true
  });

  assert.equal(third.payload.targets[1].health.code, "error");
  assert.equal(service.alertsData.alerts.length, 1);

  const snapshot = JSON.parse(await readFile(join(rootDir, "public", "data", "dashboard-snapshot.json"), "utf8"));
  const snapshotHistory = JSON.parse(await readFile(join(rootDir, "public", "data", "snapshot-history.json"), "utf8"));
  const archivedSnapshot = JSON.parse(
    await readFile(join(rootDir, "public", "data", "history", `${snapshotHistory.snapshots[0].id}.json`), "utf8")
  );

  assert.equal(snapshot.targets.length, TARGETS.length);
  assert.ok(Array.isArray(snapshotHistory.snapshots) && snapshotHistory.snapshots.length >= 1);
  assert.equal(archivedSnapshot.targets.length, TARGETS.length);
});
