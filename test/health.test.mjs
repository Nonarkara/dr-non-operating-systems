import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPublishedHealthPayload,
  detectHealthTransition,
  shouldPreservePreviousSnapshot
} from "../src/services/operations-service.js";

test("published health reports degraded when snapshot is stale", () => {
  const staleSnapshot = {
    generatedAt: "2020-01-01T00:00:00.000Z",
    github: { status: "live" },
    mentions: { status: "live" },
    summary: {
      attentionCount: 0,
      liveCount: 10,
      monitoredPages: 10,
      fleetUptime24h: 99.9,
      issues: []
    }
  };

  const health = buildPublishedHealthPayload({
    snapshot: staleSnapshot,
    jobStatus: {
      lastSuccessfulScanAt: "2020-01-01T00:00:00.000Z",
      lastFailedScanAt: null,
      lastPublishedSnapshotAt: "2020-01-01T00:00:00.000Z"
    },
    activeIncidents: 0,
    environmentIssues: []
  });

  assert.equal(health.status, "degraded");
  assert.equal(health.snapshotFreshness, "stale");
});

test("detectHealthTransition only fires on state changes", () => {
  const previous = new Map([["alpha", "live"]]);

  const down = detectHealthTransition("alpha", "Alpha", "offline", true, previous);
  const repeat = detectHealthTransition("alpha", "Alpha", "offline", true, previous);
  const recovery = detectHealthTransition("alpha", "Alpha", "live", true, previous);

  assert.equal(down.type, "down");
  assert.equal(repeat, null);
  assert.equal(recovery.type, "recovery");
});

test("previous snapshot is preserved when network fails fleet-wide", () => {
  const shouldPreserve = shouldPreservePreviousSnapshot(
    {
      summary: { liveCount: 10 },
      github: { status: "live" },
      targets: [{ id: "a" }]
    },
    {
      github: { status: "offline", error: "fetch failed" },
      targets: [
        { health: { code: "offline", reason: "fetch failed" } },
        { health: { code: "offline", reason: "timed out" } }
      ]
    }
  );

  assert.equal(shouldPreserve, true);
});
