import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_ADMIN_MAX_BYTES,
  DEFAULT_BEACON_MAX_BYTES,
  DEFAULT_BEACON_RATE_LIMIT,
  DEFAULT_FETCH_RETRIES,
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_GITHUB_TIMEOUT_MS,
  DEFAULT_MENTIONS_TIMEOUT_MS,
  DEFAULT_WEBHOOK_TIMEOUT_MS
} from "./data/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_ROOT_DIR = dirname(__dirname);

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolFromEnv(value, fallback = false) {
  if (value == null || value === "") {
    return fallback;
  }

  return /^(1|true|yes|on)$/i.test(String(value));
}

export function createConfig({ env = process.env, rootDir = DEFAULT_ROOT_DIR } = {}) {
  const publicDir = join(rootDir, "public");
  const dataDir = join(publicDir, "data");

  return {
    rootDir,
    publicDir,
    dataDir,
    files: {
      snapshot: join(dataDir, "dashboard-snapshot.json"),
      scanResult: join(dataDir, "last-scan-result.json"),
      jobStatus: join(dataDir, "job-status.json"),
      healthHistory: join(dataDir, "health-history.json"),
      analytics: join(dataDir, "analytics.json"),
      alerts: join(dataDir, "alerts.json"),
      triggers: join(dataDir, "triggers.json"),
      snapshotHistory: join(dataDir, "snapshot-history.json"),
      snapshotHistoryDir: join(dataDir, "history")
    },
    server: {
      host: env.HOST || (env.RENDER ? "0.0.0.0" : "127.0.0.1"),
      port: numberFromEnv(env.PORT, 4178),
      noListen: env.NO_LISTEN === "1",
      environment: env.NODE_ENV || "development"
    },
    auth: {
      adminBearerToken: env.ADMIN_BEARER_TOKEN || "",
      strictAdminAuth: env.NODE_ENV === "production"
    },
    external: {
      alertWebhookUrl: env.ALERT_WEBHOOK_URL || "",
      githubToken: env.GITHUB_TOKEN || env.GH_TOKEN || env.GITHUB_API_TOKEN || "",
      supabaseUrl: env.SUPABASE_URL || "",
      supabaseKey: env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY || ""
    },
    schedule: {
      managedBy: "external",
      timezone: "Asia/Bangkok",
      snapshotCron: env.SNAPSHOT_JOB_CRON || "17 */2 * * *",
      watchdogCron: env.WATCHDOG_CRON || "*/30 * * * *"
    },
    limits: {
      beaconMaxBytes: numberFromEnv(env.BEACON_MAX_BYTES, DEFAULT_BEACON_MAX_BYTES),
      adminMaxBytes: numberFromEnv(env.ADMIN_MAX_BYTES, DEFAULT_ADMIN_MAX_BYTES),
      beaconPerMinute: numberFromEnv(env.BEACON_RATE_LIMIT_PER_MINUTE, DEFAULT_BEACON_RATE_LIMIT)
    },
    fetch: {
      retries: numberFromEnv(env.FETCH_RETRIES, DEFAULT_FETCH_RETRIES),
      timeoutMs: numberFromEnv(env.FETCH_TIMEOUT_MS, DEFAULT_FETCH_TIMEOUT_MS),
      githubTimeoutMs: numberFromEnv(env.GITHUB_TIMEOUT_MS, DEFAULT_GITHUB_TIMEOUT_MS),
      mentionsTimeoutMs: numberFromEnv(env.MENTIONS_TIMEOUT_MS, DEFAULT_MENTIONS_TIMEOUT_MS),
      webhookTimeoutMs: numberFromEnv(env.WEBHOOK_TIMEOUT_MS, DEFAULT_WEBHOOK_TIMEOUT_MS)
    },
    flags: {
      preservePreviousSnapshotOnNetworkFailure: boolFromEnv(env.PRESERVE_PREVIOUS_SNAPSHOT_ON_NETWORK_FAILURE, true)
    }
  };
}

export function getEnvironmentIssues(config) {
  const issues = [];

  if (!config.auth.adminBearerToken) {
    issues.push({
      severity: config.auth.strictAdminAuth ? "error" : "warning",
      code: "ADMIN_BEARER_TOKEN_MISSING",
      message: "Admin API routes are not protected by a configured bearer token."
    });
  }

  if (!config.external.supabaseUrl || !config.external.supabaseKey) {
    issues.push({
      severity: "warning",
      code: "SUPABASE_NOT_CONFIGURED",
      message: "Supabase is not configured; the service will use file exports as a local fallback."
    });
  }

  if (!config.external.githubToken) {
    issues.push({
      severity: "warning",
      code: "GITHUB_TOKEN_MISSING",
      message: "GitHub API calls may hit rate limits without an access token."
    });
  }

  if (!config.external.alertWebhookUrl) {
    issues.push({
      severity: "info",
      code: "ALERT_WEBHOOK_URL_MISSING",
      message: "Alert webhooks are disabled."
    });
  }

  return issues;
}
