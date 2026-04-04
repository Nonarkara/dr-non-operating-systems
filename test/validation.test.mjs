import test from "node:test";
import assert from "node:assert/strict";

import {
  BeaconPayloadSchema,
  ScanRunPayloadSchema,
  TriggerClaimPayloadSchema,
  TriggerResolvePayloadSchema
} from "../src/lib/validation.js";

test("BeaconPayloadSchema accepts expected payloads", () => {
  const result = BeaconPayloadSchema.validate({
    projectId: "operations-radar",
    path: "/",
    responseMs: 123
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.projectId, "operations-radar");
});

test("BeaconPayloadSchema rejects invalid responseMs", () => {
  const result = BeaconPayloadSchema.validate({
    projectId: "operations-radar",
    responseMs: "fast"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors[0], /responseMs/);
});

test("Trigger payload validators enforce required fields", () => {
  assert.equal(TriggerClaimPayloadSchema.validate({ claimedBy: "watchdog" }).ok, true);
  assert.equal(TriggerResolvePayloadSchema.validate({ resolution: "Recovered" }).ok, true);
  assert.equal(TriggerClaimPayloadSchema.validate({}).ok, false);
  assert.equal(TriggerResolvePayloadSchema.validate({}).ok, false);
});

test("ScanRunPayloadSchema normalizes defaults", () => {
  const result = ScanRunPayloadSchema.validate({});

  assert.equal(result.ok, true);
  assert.equal(result.value.force, false);
  assert.equal(result.value.publish, true);
});
