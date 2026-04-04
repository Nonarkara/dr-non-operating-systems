function chunk(array, size) {
  const chunks = [];

  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }

  return chunks;
}

export class SupabaseRepository {
  constructor(config, { fetchFn = fetch, logger }) {
    this.config = config;
    this.fetch = fetchFn;
    this.logger = logger;
  }

  isEnabled() {
    return Boolean(this.config.external.supabaseUrl && this.config.external.supabaseKey);
  }

  async request(table, method, body, query = "", prefer = "return=minimal") {
    if (!this.isEnabled()) {
      return null;
    }

    const url = `${this.config.external.supabaseUrl}/rest/v1/${table}${query}`;

    try {
      const response = await this.fetch(url, {
        method,
        headers: {
          apikey: this.config.external.supabaseKey,
          authorization: `Bearer ${this.config.external.supabaseKey}`,
          "content-type": "application/json",
          prefer
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.config.fetch.timeoutMs)
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        this.logger?.error("supabase.request_failed", {
          table,
          method,
          statusCode: response.status,
          response: text.slice(0, 300)
        });
      }

      return response;
    } catch (error) {
      this.logger?.error("supabase.request_error", {
        table,
        method,
        message: error.message
      });
      return null;
    }
  }

  async upsertTargets(targets) {
    if (!this.isEnabled() || !targets.length) {
      return;
    }

    const rows = targets.map((target) => ({
      id: target.id,
      label: target.label,
      url: target.url,
      description: target.description || null,
      repo: target.repo?.fullName || target.repo || null,
      category: target.category || null,
      surface: target.surface || null,
      featured: Boolean(target.featured),
      added_at: target.addedAt || null
    }));

    await this.request(
      "targets",
      "POST",
      rows,
      "?on_conflict=id",
      "resolution=merge-duplicates,return=minimal"
    );
  }

  async insertHealthChecks(scanId, targets) {
    if (!this.isEnabled() || !targets.length) {
      return;
    }

    const rows = targets.map((target) => ({
      external_key: `${scanId}:${target.id}`,
      scan_id: scanId,
      target_id: target.id,
      checked_at: target.checkedAt,
      status_code: target.statusCode,
      ok: target.health?.code === "live",
      health_code: target.health?.code || "unknown",
      health_label: target.health?.label || "Unknown",
      health_reason: target.health?.reason || null,
      response_time_ms: target.responseTimeMs ?? null,
      final_url: target.finalUrl || target.url,
      hostname: target.hostname || null,
      platform: target.platform || null,
      metadata: target.metadata || {}
    }));

    for (const batch of chunk(rows, 100)) {
      await this.request(
        "health_checks",
        "POST",
        batch,
        "?on_conflict=external_key",
        "resolution=merge-duplicates,return=minimal"
      );
    }
  }

  async upsertDailyUptimeRows(rows) {
    if (!this.isEnabled() || !rows.length) {
      return;
    }

    for (const batch of chunk(rows, 100)) {
      await this.request(
        "daily_uptime",
        "POST",
        batch,
        "?on_conflict=target_id,date",
        "resolution=merge-duplicates,return=minimal"
      );
    }
  }

  async upsertVisitorDailyRows(rows) {
    if (!this.isEnabled() || !rows.length) {
      return;
    }

    for (const batch of chunk(rows, 100)) {
      await this.request(
        "visitor_daily",
        "POST",
        batch,
        "?on_conflict=project_id,date",
        "resolution=merge-duplicates,return=minimal"
      );
    }
  }

  async upsertTrigger(trigger) {
    if (!this.isEnabled() || !trigger) {
      return;
    }

    await this.request(
      "triggers",
      "POST",
      {
        external_key: trigger.id,
        target_id: trigger.targetId,
        target_label: trigger.targetLabel,
        type: trigger.type,
        severity: trigger.severity,
        status: trigger.status,
        context: trigger.context || {},
        claimed_by: trigger.claimedBy || null,
        created_at: trigger.createdAt,
        resolved_at: trigger.resolvedAt || null,
        resolution: trigger.resolution || null,
        audit_log: trigger.auditLog || []
      },
      "?on_conflict=external_key",
      "resolution=merge-duplicates,return=minimal"
    );
  }

  async insertIncident(alert, target) {
    if (!this.isEnabled() || !alert) {
      return;
    }

    await this.request(
      "incidents",
      "POST",
      {
        external_key: alert.id,
        target_id: alert.targetId,
        target_label: alert.targetLabel,
        severity: alert.severity,
        type: alert.type,
        message: alert.message,
        platform: target?.platform || null,
        error_reason: target?.health?.reason || null,
        started_at: alert.timestamp,
        resolved_at: alert.resolvedAt || null
      },
      "?on_conflict=external_key",
      "resolution=merge-duplicates,return=minimal"
    );
  }

  async resolveOpenIncidents(targetId, resolvedAt) {
    if (!this.isEnabled()) {
      return;
    }

    await this.request(
      "incidents",
      "PATCH",
      { resolved_at: resolvedAt },
      `?target_id=eq.${encodeURIComponent(targetId)}&resolved_at=is.null`
    );
  }

  async upsertJobRun(jobRun) {
    if (!this.isEnabled() || !jobRun) {
      return;
    }

    await this.request(
      "job_runs",
      "POST",
      {
        external_key: jobRun.id,
        job_type: jobRun.type,
        source: jobRun.source,
        actor: jobRun.actor || null,
        request_id: jobRun.requestId || null,
        status: jobRun.status,
        started_at: jobRun.startedAt,
        finished_at: jobRun.finishedAt || null,
        error_message: jobRun.errorMessage || null,
        meta: jobRun.meta || {}
      },
      "?on_conflict=external_key",
      "resolution=merge-duplicates,return=minimal"
    );
  }
}
