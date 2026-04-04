function ok(value) {
  return { ok: true, value, errors: [] };
}

function fail(...errors) {
  return { ok: false, value: null, errors };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(value, name, { required = false, min = 0, max = 4096 } = {}) {
  if (value == null || value === "") {
    return required ? `${name} is required.` : null;
  }

  if (typeof value !== "string") {
    return `${name} must be a string.`;
  }

  if (value.length < min) {
    return `${name} must be at least ${min} characters.`;
  }

  if (value.length > max) {
    return `${name} must be at most ${max} characters.`;
  }

  return null;
}

function booleanField(value, name) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "boolean") {
    return `${name} must be a boolean.`;
  }

  return null;
}

function numberField(value, name, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  if (value == null) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return `${name} must be a finite number.`;
  }

  if (value < min || value > max) {
    return `${name} must be between ${min} and ${max}.`;
  }

  return null;
}

export const BeaconPayloadSchema = {
  name: "BeaconPayload",
  validate(payload) {
    if (!isPlainObject(payload)) {
      return fail("Beacon payload must be a JSON object.");
    }

    const errors = [
      stringField(payload.projectId, "projectId", { max: 128 }),
      stringField(payload.path, "path", { max: 512 }),
      stringField(payload.ip, "ip", { max: 128 }),
      stringField(payload.userAgent, "userAgent", { max: 1024 }),
      stringField(payload.country, "country", { max: 128 }),
      numberField(payload.responseMs, "responseMs", { min: 0, max: 120_000 })
    ].filter(Boolean);

    return errors.length ? fail(...errors) : ok({
      country: payload.country || null,
      ip: payload.ip || null,
      path: payload.path || "/",
      projectId: payload.projectId || "unknown",
      responseMs: payload.responseMs ?? null,
      userAgent: payload.userAgent || ""
    });
  }
};

export const TriggerClaimPayloadSchema = {
  name: "TriggerClaimPayload",
  validate(payload) {
    if (!isPlainObject(payload)) {
      return fail("Trigger claim payload must be a JSON object.");
    }

    const error = stringField(payload.claimedBy, "claimedBy", { required: true, min: 1, max: 128 });
    return error ? fail(error) : ok({ claimedBy: payload.claimedBy.trim() });
  }
};

export const TriggerResolvePayloadSchema = {
  name: "TriggerResolvePayload",
  validate(payload) {
    if (!isPlainObject(payload)) {
      return fail("Trigger resolve payload must be a JSON object.");
    }

    const error = stringField(payload.resolution, "resolution", { required: true, min: 1, max: 2000 });
    return error ? fail(error) : ok({ resolution: payload.resolution.trim() });
  }
};

export const ScanRunPayloadSchema = {
  name: "ScanRunPayload",
  validate(payload) {
    if (!isPlainObject(payload)) {
      return fail("Scan run payload must be a JSON object.");
    }

    const errors = [
      booleanField(payload.force, "force"),
      booleanField(payload.publish, "publish"),
      stringField(payload.reason, "reason", { max: 512 })
    ].filter(Boolean);

    return errors.length ? fail(...errors) : ok({
      force: payload.force ?? false,
      publish: payload.publish ?? true,
      reason: payload.reason || null
    });
  }
};

export const PublishSnapshotPayloadSchema = {
  name: "PublishSnapshotPayload",
  validate(payload) {
    if (!isPlainObject(payload)) {
      return fail("Publish snapshot payload must be a JSON object.");
    }

    const error = stringField(payload.reason, "reason", { max: 512 });
    return error ? fail(error) : ok({ reason: payload.reason || null });
  }
};

export const DashboardSnapshotSchema = {
  name: "DashboardSnapshot",
  validate(payload) {
    if (!isPlainObject(payload)) {
      return fail("Dashboard snapshot must be an object.");
    }

    const errors = [];

    if (typeof payload.generatedAt !== "string") {
      errors.push("generatedAt must be a string.");
    }

    if (!Array.isArray(payload.targets)) {
      errors.push("targets must be an array.");
    }

    if (!isPlainObject(payload.summary)) {
      errors.push("summary must be an object.");
    }

    return errors.length ? fail(...errors) : ok(payload);
  }
};

export const HealthResponseSchema = {
  name: "HealthResponse",
  validate(payload) {
    if (!isPlainObject(payload)) {
      return fail("Health response must be an object.");
    }

    const errors = [];

    if (typeof payload.status !== "string") {
      errors.push("status must be a string.");
    }

    if (typeof payload.mode !== "string") {
      errors.push("mode must be a string.");
    }

    if (!isPlainObject(payload.dependencies)) {
      errors.push("dependencies must be an object.");
    }

    return errors.length ? fail(...errors) : ok(payload);
  }
};

export function assertSchema(schema, payload) {
  const result = schema.validate(payload);

  if (!result.ok) {
    const error = new Error(`${schema.name} validation failed: ${result.errors.join(" ")}`);
    error.code = "SCHEMA_VALIDATION_FAILED";
    throw error;
  }

  return result.value;
}
