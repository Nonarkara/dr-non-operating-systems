import { randomUUID } from "node:crypto";

import {
  API_INVENTORY,
  GITHUB_REPO,
  GITHUB_USERNAME,
  MENTION_ALIASES,
  MENTION_FEEDS,
  MENTION_QUERY,
  MENTION_SOURCE,
  SNAPSHOT_COMMITS_PATH,
  TARGETS
} from "../data/catalog.js";
import {
  ALERT_COOLDOWN_MS,
  ALERT_LIMIT,
  ANALYTICS_RETENTION_DAYS,
  DASHBOARD_TTL_MS,
  GEO_CACHE_TTL_MS,
  GITHUB_TTL_MS,
  HISTORY_BUCKET_LIMIT,
  MENTION_ITEM_LIMIT,
  MENTIONS_TTL_MS,
  MIME_TYPES,
  REPO_TTL_MS,
  SAMPLE_LIMIT,
  STALE_SNAPSHOT_MS,
  TRIGGER_DELAY_MS,
  TRIGGER_LIMIT
} from "../data/constants.js";
import { assertSchema, DashboardSnapshotSchema } from "../lib/validation.js";

function median(numbers) {
  if (!numbers.length) {
    return null;
  }

  const sorted = [...numbers].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getHourKey(date = new Date()) {
  return date.toISOString().slice(0, 13);
}

function emptyJobStatus() {
  return {
    version: 1,
    lastSuccessfulScanAt: null,
    lastFailedScanAt: null,
    lastPublishedSnapshotAt: null,
    lastObservedHealthByTarget: {},
    latestRuns: []
  };
}

const SNAPSHOT_HISTORY_LIMIT = 24;

function buildSnapshotArchiveId(timestamp = nowIso()) {
  return String(timestamp).replace(/[:.]/g, "-");
}

function buildMentionSearchUrl(locale = MENTION_FEEDS[0].locale) {
  const url = new URL("https://news.google.com/search");
  url.searchParams.set("q", MENTION_QUERY);
  url.searchParams.set("hl", locale.hl);
  url.searchParams.set("gl", locale.gl);
  url.searchParams.set("ceid", locale.ceid);
  return url.toString();
}

function buildMentionFeedUrl(locale) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", MENTION_QUERY);
  url.searchParams.set("hl", locale.hl);
  url.searchParams.set("gl", locale.gl);
  url.searchParams.set("ceid", locale.ceid);
  return url.toString();
}

function buildMentionsSnapshot({
  checkedAt = null,
  error = null,
  items = [],
  status = "empty"
} = {}) {
  const latestAt = items[0]?.publishedAt ?? null;

  return {
    checkedAt,
    error,
    items,
    latestAt,
    scannedAliases: MENTION_ALIASES,
    searchUrl: buildMentionSearchUrl(),
    source: MENTION_SOURCE,
    status
  };
}

function decodeHtmlEntities(value) {
  if (!value) {
    return value;
  }

  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    middot: "·",
    nbsp: " ",
    quot: "\""
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity.startsWith("#x")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    return named[entity.toLowerCase()] ?? match;
  });
}

function stripHtmlTags(value) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractXmlTag(block, tagName) {
  const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return block.match(pattern)?.[1]?.trim() ?? null;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

function normalizeMentionTitle(title, source) {
  if (!title) {
    return title;
  }

  const cleaned = stripHtmlTags(title)
    .replace(/\s+-\s+[^-]+$/, "")
    .trim();

  if (source && cleaned.endsWith(` - ${source}`)) {
    return cleaned.slice(0, -(` - ${source}`).length).trim();
  }

  return cleaned;
}

function parseMentionFeed(xml, feedLabel) {
  const items = [];
  const matches = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of matches) {
    const rawTitle = extractXmlTag(block, "title");
    const link = extractXmlTag(block, "link");
    const publishedAt = extractXmlTag(block, "pubDate");
    const source = extractXmlTag(block, "source") || feedLabel;
    const title = normalizeMentionTitle(rawTitle, source);

    if (!title || !link) {
      continue;
    }

    items.push({
      title,
      url: link,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : nowIso(),
      source
    });
  }

  return items;
}

function detectPlatform(urlString, headers = {}) {
  const hostname = new URL(urlString).hostname.toLowerCase();
  const serverHeader = `${headers.server || ""} ${headers["x-render-origin-server"] || ""}`.toLowerCase();

  if (hostname.endsWith("github.io")) {
    return "GitHub Pages";
  }

  if (hostname.endsWith("onrender.com") || headers["rndr-id"] || headers["x-render-origin-server"]) {
    return "Render";
  }

  if (hostname.endsWith("vercel.app") || serverHeader.includes("vercel")) {
    return "Vercel";
  }

  if (hostname.endsWith("lovable.app")) {
    return "Lovable";
  }

  return "Web";
}

function buildTargetHealth({ response, title, repo, platform }) {
  if (response.ok) {
    return {
      code: "live",
      label: "Live",
      reason: "Healthy response."
    };
  }

  if (
    response.status === 404 &&
    platform === "GitHub Pages" &&
    title?.includes("Site not found") &&
    repo &&
    repo.hasPages === false
  ) {
    return {
      code: "pages-off",
      label: "Pages Off",
      reason: "Repository exists, but GitHub Pages is disabled."
    };
  }

  if (response.status === 404) {
    return {
      code: "missing",
      label: "Missing",
      reason: "The deployment returned 404."
    };
  }

  if (response.status >= 500) {
    return {
      code: "error",
      label: "Error",
      reason: "The deployment returned a server error."
    };
  }

  return {
    code: "degraded",
    label: "Degraded",
    reason: `The deployment returned HTTP ${response.status}.`
  };
}

function buildApiInventory(target, baseUrl) {
  const entries = API_INVENTORY[target.id] || [];

  return entries.map((entry) => ({
    ...entry,
    url: /^https?:\/\//i.test(entry.url) ? entry.url : new URL(entry.url, baseUrl).toString()
  }));
}

function computeUptime(buckets, hours) {
  const cutoff = new Date(Date.now() - hours * 3600_000).toISOString().slice(0, 13);
  const relevant = buckets.filter((bucket) => bucket.hour >= cutoff);

  if (!relevant.length) {
    return null;
  }

  const totalChecks = relevant.reduce((sum, bucket) => sum + bucket.checks, 0);
  const totalUps = relevant.reduce((sum, bucket) => sum + bucket.ups, 0);
  return totalChecks > 0 ? Math.round((totalUps / totalChecks) * 10000) / 100 : null;
}

function isLikelyNetworkFailure(message) {
  return /fetch failed|network|timed out|econn|enotfound|eai_again|socket|tls|certificate|terminated/i.test(
    String(message || "")
  );
}

function isNetworkOfflineTarget(target) {
  return target?.health?.code === "offline" && isLikelyNetworkFailure(target.health?.reason);
}

export function shouldPreservePreviousSnapshot(previousSnapshot, payload) {
  const previousTargets = previousSnapshot?.targets ?? [];
  const nextTargets = payload?.targets ?? [];

  if (!previousTargets.length || !nextTargets.length) {
    return false;
  }

  const allTargetsLookNetworkOffline = nextTargets.every(isNetworkOfflineTarget);
  const githubLooksNetworkOffline =
    payload?.github?.status === "offline" && isLikelyNetworkFailure(payload.github?.error);
  const previousHadUsableData =
    (previousSnapshot?.summary?.liveCount ?? 0) > 0 || previousSnapshot?.github?.status === "live";

  return allTargetsLookNetworkOffline && githubLooksNetworkOffline && previousHadUsableData;
}

export function buildPublishedHealthPayload({
  snapshot,
  jobStatus,
  activeIncidents,
  environmentIssues
}) {
  const generatedAtMs = snapshot?.generatedAt ? Date.parse(snapshot.generatedAt) : Number.NaN;
  const snapshotAgeMs = Number.isFinite(generatedAtMs) ? Date.now() - generatedAtMs : null;
  const snapshotStale = snapshotAgeMs === null || snapshotAgeMs > STALE_SNAPSHOT_MS;
  const lastSuccessfulScanAt = jobStatus?.lastSuccessfulScanAt ?? snapshot?.generatedAt ?? null;
  const lastFailedScanAt = jobStatus?.lastFailedScanAt ?? null;
  const scanRecentlyFailed = Boolean(
    lastFailedScanAt &&
    (!lastSuccessfulScanAt || Date.parse(lastFailedScanAt) > Date.parse(lastSuccessfulScanAt))
  );
  const issues = [
    ...(snapshot?.summary?.issues ?? []).slice(0, 5),
    ...environmentIssues.filter((issue) => issue.severity !== "info")
  ];

  const status = snapshotStale || scanRecentlyFailed || activeIncidents > 0 || issues.length ? "degraded" : "ok";

  return {
    service: "non-operations-radar",
    status,
    mode: "snapshot",
    time: nowIso(),
    generatedAt: snapshot?.generatedAt ?? null,
    snapshotAgeMs,
    snapshotFreshness: snapshotStale ? "stale" : "fresh",
    lastSuccessfulScanAt,
    lastFailedScanAt,
    lastPublishedSnapshotAt: jobStatus?.lastPublishedSnapshotAt ?? snapshot?.generatedAt ?? null,
    activeIncidents,
    summary: snapshot?.summary
      ? {
          attentionCount: snapshot.summary.attentionCount,
          liveCount: snapshot.summary.liveCount,
          monitoredPages: snapshot.summary.monitoredPages,
          fleetUptime24h: snapshot.summary.fleetUptime24h ?? null
        }
      : null,
    dependencies: {
      github: snapshot?.github?.status ?? "unknown",
      mentions: snapshot?.mentions?.status ?? "unknown",
      supabase: environmentIssues.some((issue) => issue.code === "SUPABASE_NOT_CONFIGURED") ? "fallback" : "live"
    },
    issues
  };
}

export function detectHealthTransition(targetId, targetLabel, newHealth, featured, previousHealthByTarget) {
  const previous = previousHealthByTarget.get(targetId);
  previousHealthByTarget.set(targetId, newHealth);

  if (!previous) {
    return null;
  }

  const wasUp = previous === "live";
  const isUp = newHealth === "live";

  if (wasUp && !isUp) {
    return {
      type: "down",
      severity: featured ? "critical" : "warning",
      message: `${targetLabel} went down (${newHealth})`
    };
  }

  if (!wasUp && isUp) {
    return {
      type: "recovery",
      severity: "info",
      message: `${targetLabel} recovered`
    };
  }

  if (wasUp && newHealth === "degraded") {
    return {
      type: "degraded",
      severity: "warning",
      message: `${targetLabel} is degraded`
    };
  }

  return null;
}

export class OperationsService {
  constructor({
    config,
    logger,
    fileRepository,
    supabaseRepository,
    fetchFn = fetch,
    environmentIssues = []
  }) {
    this.config = config;
    this.logger = logger;
    this.fileRepository = fileRepository;
    this.supabaseRepository = supabaseRepository;
    this.fetch = fetchFn;
    this.environmentIssues = environmentIssues;

    this.historyByTarget = new Map();
    this.repoCache = new Map();
    this.githubCache = { value: null, fetchedAt: 0, promise: null };
    this.mentionsCache = { value: null, fetchedAt: 0, promise: null };
    this.dashboardCache = { value: null, fetchedAt: 0, promise: null };
    this.snapshotCommitsCache = { value: null, fetchedAt: 0 };
    this.historicalSnapshotCache = new Map();
    this.healthHistory = { targets: {}, updatedAt: null };
    this.analyticsData = { projects: {} };
    this.alertsData = { alerts: [] };
    this.triggersData = { triggers: [] };
    this.jobStatus = emptyJobStatus();
    this.previousHealthByTarget = new Map();
    this.alertCooldowns = new Map();
    this.downSince = new Map();
    this.geoCache = new Map();
    this.geoPending = new Set();
    this.activeScanPromise = null;
  }

  async initialize() {
    this.healthHistory = await this.fileRepository.readHealthHistory();
    this.analyticsData = await this.fileRepository.readAnalytics();
    this.alertsData = await this.fileRepository.readAlerts();
    this.triggersData = await this.fileRepository.readTriggers();
    this.jobStatus = {
      ...emptyJobStatus(),
      ...(await this.fileRepository.readJobStatus())
    };

    const snapshot = await this.fileRepository.readPublishedSnapshot();
    this.hydrateHistoryFromSnapshot(snapshot);
    this.restoreObservedHealth(snapshot);

    for (const trigger of this.triggersData.triggers) {
      if (trigger.status !== "resolved") {
        this.downSince.set(trigger.targetId, Date.parse(trigger.createdAt));
      }
    }
  }

  restoreObservedHealth(snapshot) {
    const observed = this.jobStatus.lastObservedHealthByTarget || {};

    for (const [targetId, health] of Object.entries(observed)) {
      this.previousHealthByTarget.set(targetId, health);
    }

    for (const target of snapshot?.targets ?? []) {
      if (!this.previousHealthByTarget.has(target.id) && target.health?.code) {
        this.previousHealthByTarget.set(target.id, target.health.code);
      }
    }
  }

  hydrateHistoryFromSnapshot(snapshot) {
    this.historyByTarget.clear();

    for (const target of snapshot?.targets ?? []) {
      if (!Array.isArray(target.history) || !target.id) {
        continue;
      }

      this.historyByTarget.set(
        target.id,
        target.history.slice(-SAMPLE_LIMIT).map((point) => ({
          at: point.at,
          health: point.health,
          ok: point.ok,
          responseTimeMs: point.responseTimeMs,
          statusCode: point.statusCode
        }))
      );
    }
  }

  async flushOperationalState() {
    this.healthHistory.updatedAt = nowIso();
    await Promise.all([
      this.fileRepository.writeHealthHistory(this.healthHistory),
      this.fileRepository.writeAnalytics(this.analyticsData),
      this.fileRepository.writeAlerts(this.alertsData),
      this.fileRepository.writeTriggers(this.triggersData),
      this.fileRepository.writeJobStatus(this.jobStatus)
    ]);
  }

  async readPublishedSnapshot() {
    const snapshot = await this.fileRepository.readPublishedSnapshot();

    if (!snapshot) {
      throw new Error("Snapshot file unavailable");
    }

    return assertSchema(DashboardSnapshotSchema, snapshot);
  }

  async getPublicDashboard() {
    return this.readPublishedSnapshot();
  }

  async getPublicMentions() {
    const snapshot = await this.readPublishedSnapshot();
    return snapshot.mentions ?? buildMentionsSnapshot({
      checkedAt: snapshot.generatedAt ?? null,
      error: "Mention snapshot unavailable.",
      status: "offline"
    });
  }

  async getPublicHealth() {
    const snapshot = await this.readPublishedSnapshot();

    return buildPublishedHealthPayload({
      snapshot,
      jobStatus: this.jobStatus,
      activeIncidents: this.getActiveIncidents().length,
      environmentIssues: this.environmentIssues
    });
  }

  getAdminSchedulerState() {
    return {
      managedBy: this.config.schedule.managedBy,
      timezone: this.config.schedule.timezone,
      snapshotCron: this.config.schedule.snapshotCron,
      watchdogCron: this.config.schedule.watchdogCron,
      webSchedulerEnabled: false,
      lastSuccessfulScanAt: this.jobStatus.lastSuccessfulScanAt,
      lastFailedScanAt: this.jobStatus.lastFailedScanAt,
      lastPublishedSnapshotAt: this.jobStatus.lastPublishedSnapshotAt
    };
  }

  recordHistory(targetId, point) {
    if (!this.historyByTarget.has(targetId)) {
      this.historyByTarget.set(targetId, []);
    }

    const history = this.historyByTarget.get(targetId);
    history.push(point);

    while (history.length > SAMPLE_LIMIT) {
      history.shift();
    }
  }

  recordHistoryBucket(targetId, ok, responseTimeMs) {
    if (!this.healthHistory.targets[targetId]) {
      this.healthHistory.targets[targetId] = { buckets: [] };
    }

    const buckets = this.healthHistory.targets[targetId].buckets;
    const hour = getHourKey();
    let current = buckets[buckets.length - 1];

    if (!current || current.hour !== hour) {
      current = {
        hour,
        checks: 0,
        ups: 0,
        totalMs: 0,
        minMs: null,
        maxMs: null
      };
      buckets.push(current);
    }

    current.checks++;

    if (ok) {
      current.ups++;
    }

    if (responseTimeMs != null) {
      current.totalMs += responseTimeMs;

      if (current.minMs === null || responseTimeMs < current.minMs) {
        current.minMs = responseTimeMs;
      }

      if (current.maxMs === null || responseTimeMs > current.maxMs) {
        current.maxMs = responseTimeMs;
      }
    }

    while (buckets.length > HISTORY_BUCKET_LIMIT) {
      buckets.shift();
    }
  }

  getTargetUptime(targetId) {
    const entry = this.healthHistory.targets[targetId];

    if (!entry) {
      return { h24: null, d7: null, d30: null };
    }

    return {
      h24: computeUptime(entry.buckets, 24),
      d7: computeUptime(entry.buckets, 168),
      d30: computeUptime(entry.buckets, 720)
    };
  }

  getTargetBuckets(targetId, hours = 168) {
    const entry = this.healthHistory.targets[targetId];

    if (!entry) {
      return [];
    }

    const cutoff = new Date(Date.now() - hours * 3600_000).toISOString().slice(0, 13);
    return entry.buckets
      .filter((bucket) => bucket.hour >= cutoff)
      .map((bucket) => ({
        hour: bucket.hour,
        checks: bucket.checks,
        ups: bucket.ups,
        avgMs: bucket.checks > 0 ? Math.round(bucket.totalMs / bucket.checks) : null,
        minMs: bucket.minMs,
        maxMs: bucket.maxMs
      }));
  }

  async fetchWithRetry(url, options = {}, retries = this.config.fetch.retries) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetch(url, options);

        if (response.status >= 500 && attempt < retries) {
          lastError = new Error(`Request failed with ${response.status}`);
          continue;
        }

        return response;
      } catch (error) {
        lastError = error;

        if (attempt >= retries) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async fetchJson(url) {
    const headers = {
      accept: "application/vnd.github+json",
      "user-agent": "non-operations-radar"
    };

    if (this.config.external.githubToken) {
      headers.authorization = `Bearer ${this.config.external.githubToken}`;
    }

    const response = await this.fetchWithRetry(url, {
      headers,
      signal: AbortSignal.timeout(this.config.fetch.githubTimeoutMs)
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed with ${response.status}`);
    }

    return response.json();
  }

  async fetchText(url, {
    accept = "application/xml,text/xml;q=0.9,*/*;q=0.8",
    timeoutMs = this.config.fetch.timeoutMs
  } = {}) {
    const response = await this.fetchWithRetry(url, {
      headers: {
        accept,
        "user-agent": "non-operations-radar"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return response.text();
  }

  async getRepoMetadata(repoSlug) {
    const cached = this.repoCache.get(repoSlug);

    if (cached?.value && Date.now() - cached.fetchedAt < REPO_TTL_MS) {
      return cached.value;
    }

    if (cached?.promise) {
      return cached.promise;
    }

    const promise = (async () => {
      try {
        const repo = await this.fetchJson(`https://api.github.com/repos/${repoSlug}`);
        const value = {
          defaultBranch: repo.default_branch,
          description: repo.description,
          fullName: repo.full_name,
          hasPages: repo.has_pages,
          language: repo.language,
          pushedAt: repo.pushed_at,
          updatedAt: repo.updated_at,
          url: repo.html_url
        };

        this.repoCache.set(repoSlug, {
          value,
          fetchedAt: Date.now(),
          promise: null
        });

        return value;
      } catch (error) {
        const value = {
          error: error.message,
          fullName: repoSlug
        };

        this.repoCache.set(repoSlug, {
          value,
          fetchedAt: Date.now(),
          promise: null
        });

        return value;
      }
    })();

    this.repoCache.set(repoSlug, {
      value: cached?.value ?? null,
      fetchedAt: cached?.fetchedAt ?? 0,
      promise
    });

    return promise;
  }

  async checkTarget(target, sideEffects = { newAlerts: [], changedTriggers: [] }) {
    const startedAt = Date.now();
    let repo = null;

    if (target.repo) {
      repo = await this.getRepoMetadata(target.repo);
    }

    try {
      const response = await this.fetchWithRetry(target.url, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "user-agent": "non-operations-radar"
        },
        redirect: "follow",
        signal: AbortSignal.timeout(this.config.fetch.timeoutMs)
      });

      const headers = Object.fromEntries(response.headers.entries());
      const contentType = headers["content-type"] || "";
      const body = contentType.includes("text/html") ? await response.text() : "";
      const title = extractTitle(body);
      const finalUrl = response.url || target.url;
      const platform = detectPlatform(finalUrl, headers);
      const health = buildTargetHealth({
        platform,
        repo,
        response,
        title
      });
      const responseTimeMs = Date.now() - startedAt;
      const checkedAt = nowIso();

      this.recordHistory(target.id, {
        at: checkedAt,
        health: health.code,
        ok: response.ok,
        responseTimeMs,
        statusCode: response.status
      });

      const result = {
        apis: buildApiInventory(target, finalUrl),
        addedAt: target.addedAt,
        category: target.category,
        checkedAt,
        description: target.description,
        featured: Boolean(target.featured),
        finalUrl,
        health,
        history: this.historyByTarget.get(target.id) ?? [],
        hostname: new URL(finalUrl).hostname,
        id: target.id,
        label: target.label,
        metadata: {
          cache: headers["cf-cache-status"] || headers["x-cache"] || null,
          contentType: contentType || null,
          etag: headers.etag || null,
          lastModified: headers["last-modified"] || null,
          server: headers.server || null,
          title,
          xPoweredBy: headers["x-powered-by"] || null
        },
        platform,
        repo,
        responseTimeMs,
        statusCode: response.status,
        surface: target.surface,
        url: target.url
      };

      await this.postCheckHook(result, sideEffects);
      return result;
    } catch (error) {
      const checkedAt = nowIso();
      const responseTimeMs = Date.now() - startedAt;

      this.recordHistory(target.id, {
        at: checkedAt,
        health: "offline",
        ok: false,
        responseTimeMs,
        statusCode: null
      });

      const result = {
        apis: buildApiInventory(target, target.url),
        addedAt: target.addedAt,
        category: target.category,
        checkedAt,
        description: target.description,
        featured: Boolean(target.featured),
        finalUrl: target.url,
        health: {
          code: "offline",
          label: "Offline",
          reason: error.name === "TimeoutError" ? "The check timed out." : error.message
        },
        history: this.historyByTarget.get(target.id) ?? [],
        hostname: new URL(target.url).hostname,
        id: target.id,
        label: target.label,
        metadata: {
          cache: null,
          contentType: null,
          etag: null,
          lastModified: null,
          server: null,
          title: null,
          xPoweredBy: null
        },
        platform: detectPlatform(target.url),
        repo,
        responseTimeMs,
        statusCode: null,
        surface: target.surface,
        url: target.url
      };

      await this.postCheckHook(result, sideEffects);
      return result;
    }
  }

  async getGitHubSnapshot(force = false) {
    if (!force && this.githubCache.value && Date.now() - this.githubCache.fetchedAt < GITHUB_TTL_MS) {
      return this.githubCache.value;
    }

    if (this.githubCache.promise) {
      return this.githubCache.promise;
    }

    this.githubCache.promise = (async () => {
      try {
        const [profile, repos] = await Promise.all([
          this.fetchJson(`https://api.github.com/users/${GITHUB_USERNAME}`),
          this.fetchJson(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`)
        ]);

        const nonForkRepos = repos.filter((repo) => !repo.fork);
        const pagesEnabledRepos = nonForkRepos.filter((repo) => repo.has_pages);
        const now = Date.now();
        const activeLast30d = nonForkRepos.filter((repo) => {
          const updatedAt = new Date(repo.updated_at).getTime();
          return now - updatedAt < 30 * 24 * 60 * 60 * 1000;
        });
        const languageCounts = nonForkRepos.reduce((accumulator, repo) => {
          if (repo.language) {
            accumulator[repo.language] = (accumulator[repo.language] || 0) + 1;
          }
          return accumulator;
        }, {});

        const topLanguages = Object.entries(languageCounts)
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([name, count]) => ({ count, name }));

        const snapshot = {
          checkedAt: nowIso(),
          profile: {
            createdAt: profile.created_at,
            followers: profile.followers,
            location: profile.location,
            login: profile.login,
            name: profile.name,
            publicRepos: profile.public_repos,
            updatedAt: profile.updated_at,
            url: profile.html_url
          },
          recentRepos: nonForkRepos.slice(0, 5).map((repo) => ({
            description: repo.description,
            hasPages: repo.has_pages,
            language: repo.language,
            name: repo.name,
            pushedAt: repo.pushed_at,
            updatedAt: repo.updated_at,
            url: repo.html_url
          })),
          stats: {
            activeLast30d: activeLast30d.length,
            githubPagesRepos: pagesEnabledRepos.length,
            latestPushAt: nonForkRepos[0]?.pushed_at ?? null,
            topLanguages
          },
          status: "live"
        };

        this.githubCache = {
          value: snapshot,
          fetchedAt: Date.now(),
          promise: null
        };

        return snapshot;
      } catch (error) {
        const snapshot = {
          checkedAt: nowIso(),
          error: error.message,
          profile: null,
          recentRepos: [],
          stats: {
            activeLast30d: null,
            githubPagesRepos: null,
            latestPushAt: null,
            topLanguages: []
          },
          status: "offline"
        };

        this.githubCache = {
          value: snapshot,
          fetchedAt: Date.now(),
          promise: null
        };

        return snapshot;
      }
    })();

    return this.githubCache.promise;
  }

  async getMentionsSnapshot(force = false) {
    if (!force && this.mentionsCache.value && Date.now() - this.mentionsCache.fetchedAt < MENTIONS_TTL_MS) {
      return this.mentionsCache.value;
    }

    if (this.mentionsCache.promise) {
      return this.mentionsCache.promise;
    }

    this.mentionsCache.promise = (async () => {
      try {
        const results = await Promise.allSettled(
          MENTION_FEEDS.map(async (feed) => {
            const xml = await this.fetchText(buildMentionFeedUrl(feed.locale), {
              timeoutMs: this.config.fetch.mentionsTimeoutMs
            });
            return parseMentionFeed(xml, feed.label);
          })
        );

        const items = [];
        const errors = [];

        for (const result of results) {
          if (result.status === "fulfilled") {
            items.push(...result.value);
          } else {
            errors.push(result.reason?.message || "Mention feed unavailable");
          }
        }

        const deduped = [...new Map(
          items.map((item) => [
            `${item.source.toLowerCase()}::${item.title.toLowerCase()}`,
            item
          ])
        ).values()]
          .sort((left, right) => new Date(right.publishedAt) - new Date(left.publishedAt))
          .slice(0, MENTION_ITEM_LIMIT);

        const snapshot = buildMentionsSnapshot({
          checkedAt: nowIso(),
          error: errors.length ? errors.join(" • ") : null,
          items: deduped,
          status: deduped.length
            ? errors.length
              ? "degraded"
              : "live"
            : errors.length
              ? "offline"
              : "empty"
        });

        this.mentionsCache = {
          value: snapshot,
          fetchedAt: Date.now(),
          promise: null
        };

        return snapshot;
      } catch (error) {
        const snapshot = buildMentionsSnapshot({
          checkedAt: nowIso(),
          error: error.message,
          status: "offline"
        });

        this.mentionsCache = {
          value: snapshot,
          fetchedAt: Date.now(),
          promise: null
        };

        return snapshot;
      }
    })();

    return this.mentionsCache.promise;
  }

  buildSummary(targets, github) {
    const liveTargets = targets.filter((target) => target.health.code === "live");
    const activeTargets = targets.filter((target) => target.surface === "active");
    const apiCount = targets.reduce((total, target) => total + target.apis.length, 0);
    const appsWithApis = targets.filter((target) => target.apis.length > 0).length;
    const staticTargets = targets.filter((target) => target.surface === "static");
    const responseTimes = liveTargets.map((target) => target.responseTimeMs).filter(Boolean);
    const platformBreakdown = targets.reduce((accumulator, target) => {
      accumulator[target.platform] = (accumulator[target.platform] || 0) + 1;
      return accumulator;
    }, {});

    const issues = targets
      .filter((target) => target.health.code !== "live")
      .map((target) => ({
        id: target.id,
        label: target.label,
        reason: target.health.reason
      }));

    const fastest = [...liveTargets].sort((left, right) => left.responseTimeMs - right.responseTimeMs)[0] ?? null;
    const slowest = [...liveTargets].sort((left, right) => right.responseTimeMs - left.responseTimeMs)[0] ?? null;

    return {
      activeCount: activeTargets.length,
      attentionCount: issues.length,
      apiCount,
      appsWithApis,
      fastest: fastest
        ? { label: fastest.label, responseTimeMs: fastest.responseTimeMs }
        : null,
      issues,
      liveCount: liveTargets.length,
      medianResponseMs: median(responseTimes),
      monitoredPages: targets.length,
      platformBreakdown: Object.entries(platformBreakdown)
        .sort((left, right) => right[1] - left[1])
        .map(([platform, count]) => ({ count, platform })),
      platformsInUse: Object.keys(platformBreakdown).length,
      publicRepos: github.profile?.publicRepos ?? null,
      slowest: slowest
        ? { label: slowest.label, responseTimeMs: slowest.responseTimeMs }
        : null,
      staticCount: staticTargets.length
    };
  }

  getActiveIncidents() {
    return this.alertsData.alerts.filter(
      (alert) => (alert.type === "down" || alert.type === "degraded") && !alert.resolvedAt
    );
  }

  getRecentAlerts(limit = 50) {
    return this.alertsData.alerts.slice(-limit).reverse();
  }

  getSuggestedActions(target) {
    const platform = target.platform || "Unknown";
    const health = target.health?.code || "offline";
    const actions = [];

    if (platform === "Render") {
      actions.push("Check Render dashboard for service status");
      actions.push("Review recent deploy logs on Render");

      if (health === "error") {
        actions.push("Check application logs for uncaught exceptions");
      }
    }

    if (platform === "GitHub Pages") {
      actions.push("Verify GitHub Pages is enabled in repo settings");
      actions.push("Check if recent push broke the build");
    }

    if (health === "offline") {
      actions.push("Check if the service process is running");
      actions.push("Verify DNS resolution and network connectivity");
    }

    if (health === "error") {
      actions.push("Check application error logs");
      actions.push("Review most recent deployment or code change");
    }

    if (health === "degraded") {
      actions.push("Check resource utilization (CPU, memory)");
      actions.push("Review rate limits on external dependencies");
    }

    actions.push("Run smoke test against the service URL");
    return actions;
  }

  async sendWebhook(alert) {
    if (!this.config.external.alertWebhookUrl) {
      return;
    }

    try {
      const color = alert.severity === "critical" ? 16711680 : alert.severity === "warning" ? 16753920 : 65280;

      await this.fetch(this.config.external.alertWebhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: `**[${alert.severity.toUpperCase()}]** ${alert.message}`,
          embeds: [{
            title: alert.message,
            color,
            fields: [
              { name: "Target", value: alert.targetLabel, inline: true },
              { name: "Type", value: alert.type, inline: true },
              { name: "Time", value: alert.timestamp, inline: true }
            ]
          }]
        }),
        signal: AbortSignal.timeout(this.config.fetch.webhookTimeoutMs)
      });
    } catch (error) {
      this.logger.error("alerts.webhook_failed", { message: error.message });
    }
  }

  fireAlert(targetId, targetLabel, transition) {
    const cooldownKey = `${targetId}:${transition.type}`;
    const lastFired = this.alertCooldowns.get(cooldownKey);

    if (lastFired && Date.now() - lastFired < ALERT_COOLDOWN_MS) {
      return null;
    }

    this.alertCooldowns.set(cooldownKey, Date.now());

    const alert = {
      id: randomUUID(),
      targetId,
      targetLabel,
      type: transition.type,
      severity: transition.severity,
      message: transition.message,
      timestamp: nowIso(),
      resolvedAt: transition.type === "recovery" ? nowIso() : null
    };

    this.alertsData.alerts.push(alert);

    while (this.alertsData.alerts.length > ALERT_LIMIT) {
      this.alertsData.alerts.shift();
    }

    if (transition.type === "recovery") {
      for (const existing of this.alertsData.alerts) {
        if (
          existing.targetId === targetId &&
          !existing.resolvedAt &&
          (existing.type === "down" || existing.type === "degraded")
        ) {
          existing.resolvedAt = alert.timestamp;
        }
      }
    }

    this.logger.info("alerts.fired", {
      severity: transition.severity,
      targetId,
      type: transition.type
    });

    void this.sendWebhook(alert);
    return alert;
  }

  maybeCreateTrigger(target, alert) {
    if (alert.type !== "down" || alert.severity !== "critical") {
      return null;
    }

    const sinceMs = this.downSince.get(target.id);
    const now = Date.now();

    if (!sinceMs) {
      this.downSince.set(target.id, now);
      return null;
    }

    if (now - sinceMs < TRIGGER_DELAY_MS) {
      return null;
    }

    const existing = this.triggersData.triggers.find(
      (trigger) => trigger.targetId === target.id && trigger.status === "open"
    );

    if (existing) {
      return existing;
    }

    const trigger = {
      id: randomUUID(),
      targetId: target.id,
      targetLabel: target.label,
      type: "system-down",
      severity: alert.severity,
      context: {
        url: target.url,
        error: target.health?.reason || "Unknown",
        platform: target.platform,
        repo: target.repo?.fullName || null,
        downtimeSince: new Date(sinceMs).toISOString(),
        responseMs: target.responseTimeMs,
        suggestedActions: this.getSuggestedActions(target)
      },
      status: "open",
      createdAt: nowIso(),
      claimedBy: null,
      resolvedAt: null,
      resolution: null,
      auditLog: [
        {
          actor: "system",
          action: "created",
          at: nowIso()
        }
      ]
    };

    this.triggersData.triggers.push(trigger);

    while (this.triggersData.triggers.length > TRIGGER_LIMIT) {
      this.triggersData.triggers.shift();
    }

    this.logger.warn("triggers.created", {
      targetId: target.id,
      triggerId: trigger.id
    });

    return trigger;
  }

  resolveTriggersForTarget(targetId, actor = "system") {
    const resolved = [];

    for (const trigger of this.triggersData.triggers) {
      if (trigger.targetId === targetId && trigger.status !== "resolved") {
        trigger.status = "resolved";
        trigger.resolvedAt = nowIso();
        trigger.auditLog = [
          ...(trigger.auditLog || []),
          {
            actor,
            action: "resolved",
            at: trigger.resolvedAt,
            resolution: trigger.resolution || "Recovered automatically"
          }
        ];
        resolved.push(trigger);
      }
    }

    this.downSince.delete(targetId);
    return resolved;
  }

  async postCheckHook(target, sideEffects) {
    const ok = target.health.code === "live";
    this.recordHistoryBucket(target.id, ok, target.responseTimeMs);

    const transition = detectHealthTransition(
      target.id,
      target.label,
      target.health.code,
      target.featured,
      this.previousHealthByTarget
    );

    if (!transition) {
      return;
    }

    const alert = this.fireAlert(target.id, target.label, transition);

    if (alert) {
      sideEffects.newAlerts.push({ alert, target });
    }

    if (alert && transition.type === "down") {
      const trigger = this.maybeCreateTrigger(target, alert);

      if (trigger) {
        sideEffects.changedTriggers.push(trigger);
      }
    }

    if (transition.type === "recovery") {
      const resolved = this.resolveTriggersForTarget(target.id);
      sideEffects.changedTriggers.push(...resolved);
    }
  }

  getAnalyticsSummary() {
    const today = todayIso();
    const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
    const projects = {};
    let fleetTodayVisitors = 0;
    let fleetWeekVisitors = 0;
    const fleetCountries = {};

    for (const [id, project] of Object.entries(this.analyticsData.projects)) {
      const todayData = project.days[today];
      let weekVisitors = 0;
      const projectCountries = {};

      for (const [date, day] of Object.entries(project.days)) {
        if (date >= weekAgo) {
          weekVisitors += day.visitors;

          for (const [country, count] of Object.entries(day.countries)) {
            projectCountries[country] = (projectCountries[country] || 0) + count;
            fleetCountries[country] = (fleetCountries[country] || 0) + count;
          }
        }
      }

      fleetTodayVisitors += (todayData?.visitors || 0);
      fleetWeekVisitors += weekVisitors;

      projects[id] = {
        today: todayData?.visitors || 0,
        todayUnique: todayData?.uniqueIps?.length || 0,
        week: weekVisitors,
        avgMs: todayData?.requests ? Math.round(todayData.totalMs / todayData.requests) : null,
        countries: projectCountries
      };
    }

    return {
      fleet: {
        todayVisitors: fleetTodayVisitors,
        weekVisitors: fleetWeekVisitors,
        countries: Object.entries(fleetCountries)
          .sort((left, right) => right[1] - left[1])
          .slice(0, 10)
          .map(([country, count]) => ({ country, count }))
      },
      projects
    };
  }

  pruneAnalytics() {
    const cutoff = new Date(Date.now() - ANALYTICS_RETENTION_DAYS * 86400_000).toISOString().slice(0, 10);

    for (const project of Object.values(this.analyticsData.projects)) {
      for (const date of Object.keys(project.days)) {
        if (date < cutoff) {
          delete project.days[date];
        }
      }
    }
  }

  recordVisit(projectId, ip, path, userAgent, responseMs) {
    if (!this.analyticsData.projects[projectId]) {
      this.analyticsData.projects[projectId] = { days: {} };
    }

    const today = todayIso();
    const project = this.analyticsData.projects[projectId];

    if (!project.days[today]) {
      project.days[today] = { visitors: 0, uniqueIps: [], countries: {}, totalMs: 0, requests: 0, paths: {} };
    }

    const day = project.days[today];
    day.visitors++;
    day.requests++;
    day.paths[path] = (day.paths[path] || 0) + 1;

    if (ip && !day.uniqueIps.includes(ip)) {
      day.uniqueIps.push(ip);
    }

    if (responseMs != null) {
      day.totalMs += responseMs;
    }
  }

  recordVisitorCountry(projectId, date, country) {
    const project = this.analyticsData.projects[projectId];

    if (!project?.days?.[date]) {
      return;
    }

    const day = project.days[date];

    if (!day.countries[country]) {
      day.countries[country] = 0;
    }

    day.countries[country]++;
  }

  async resolveGeoIp(ip) {
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return "Local";
    }

    const cached = this.geoCache.get(ip);

    if (cached && Date.now() - cached.at < GEO_CACHE_TTL_MS) {
      return cached.country;
    }

    if (this.geoPending.has(ip)) {
      return "Resolving";
    }

    this.geoPending.add(ip);

    try {
      const response = await this.fetchWithRetry(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=country`, {
        signal: AbortSignal.timeout(5000)
      }, 1);

      if (response.ok) {
        const data = await response.json();
        const country = data.country || "Unknown";
        this.geoCache.set(ip, { country, at: Date.now() });
        return country;
      }
    } catch {}
    finally {
      this.geoPending.delete(ip);
    }

    this.geoCache.set(ip, { country: "Unknown", at: Date.now() });
    return "Unknown";
  }

  async recordBeacon(payload, requestContext) {
    const projectId = payload.projectId || "unknown";
    const ip = payload.ip || requestContext.ip;
    const path = payload.path || "/";
    const userAgent = payload.userAgent || requestContext.userAgent || "";
    const responseMs = payload.responseMs ?? null;
    const country = payload.country || null;

    this.recordVisit(projectId, ip, path, userAgent, responseMs);
    this.pruneAnalytics();
    await this.fileRepository.writeAnalytics(this.analyticsData);

    if (country) {
      this.recordVisitorCountry(projectId, todayIso(), country);
      await this.fileRepository.writeAnalytics(this.analyticsData);
      return { status: "ok", country };
    }

    if (ip) {
      void this.resolveGeoIp(ip).then(async (resolvedCountry) => {
        this.recordVisitorCountry(projectId, todayIso(), resolvedCountry);
        await this.fileRepository.writeAnalytics(this.analyticsData);
      }).catch(() => {});
    }

    return { status: "ok", country: null };
  }

  createJobRun(type, source, actor, requestId, meta = {}) {
    return {
      id: randomUUID(),
      type,
      source,
      actor,
      requestId,
      status: "running",
      startedAt: nowIso(),
      finishedAt: null,
      errorMessage: null,
      meta
    };
  }

  async persistJobRun(jobRun) {
    this.jobStatus.latestRuns = [
      jobRun,
      ...this.jobStatus.latestRuns.filter((run) => run.id !== jobRun.id)
    ].slice(0, 50);
    await this.fileRepository.writeJobStatus(this.jobStatus);
    await this.supabaseRepository.upsertJobRun(jobRun);
  }

  async finalizeJobRun(jobRun, status, errorMessage = null, extraMeta = {}) {
    jobRun.status = status;
    jobRun.finishedAt = nowIso();
    jobRun.errorMessage = errorMessage;
    jobRun.meta = {
      ...jobRun.meta,
      ...extraMeta
    };

    if (jobRun.type === "scan") {
      if (status === "succeeded") {
        this.jobStatus.lastSuccessfulScanAt = jobRun.finishedAt;
      } else if (status === "failed") {
        this.jobStatus.lastFailedScanAt = jobRun.finishedAt;
      }
    }

    if (jobRun.type === "publish" && status === "succeeded") {
      this.jobStatus.lastPublishedSnapshotAt = jobRun.finishedAt;
    }

    await this.persistJobRun(jobRun);
  }

  buildDailyUptimeRows(latestTargetsById = new Map(), { allDays = false } = {}) {
    const today = todayIso();
    const rows = [];

    for (const [targetId, entry] of Object.entries(this.healthHistory.targets)) {
      const bucketsByDay = new Map();

      for (const bucket of entry.buckets ?? []) {
        const day = bucket.hour.slice(0, 10);

        if (!allDays && day !== today) {
          continue;
        }

        const current = bucketsByDay.get(day) || {
          checks: 0,
          ups: 0,
          totalMs: 0,
          minMs: null,
          maxMs: null
        };

        current.checks += bucket.checks;
        current.ups += bucket.ups;
        current.totalMs += bucket.totalMs;
        current.minMs = bucket.minMs != null && (current.minMs == null || bucket.minMs < current.minMs)
          ? bucket.minMs
          : current.minMs;
        current.maxMs = bucket.maxMs != null && (current.maxMs == null || bucket.maxMs > current.maxMs)
          ? bucket.maxMs
          : current.maxMs;
        bucketsByDay.set(day, current);
      }

      for (const [date, stats] of bucketsByDay.entries()) {
        const target = latestTargetsById.get(targetId) || TARGETS.find((candidate) => candidate.id === targetId) || {};
        rows.push({
          target_id: targetId,
          target_label: target.label || targetId,
          date,
          checks: stats.checks,
          ups: stats.ups,
          avg_response_ms: stats.checks > 0 ? Math.round(stats.totalMs / stats.checks) : null,
          min_response_ms: stats.minMs,
          max_response_ms: stats.maxMs,
          platform: target.platform || null,
          surface: target.surface || null,
          category: target.category || null
        });
      }
    }

    return rows;
  }

  buildVisitorDailyRows({ allDays = false } = {}) {
    const today = todayIso();
    const rows = [];

    for (const [projectId, project] of Object.entries(this.analyticsData.projects)) {
      for (const [date, day] of Object.entries(project.days)) {
        if (!allDays && date !== today) {
          continue;
        }

        rows.push({
          project_id: projectId,
          date,
          visitors: day.visitors || 0,
          unique_ips: day.uniqueIps?.length || 0,
          top_countries: day.countries || {},
          avg_response_ms: day.requests ? Math.round(day.totalMs / day.requests) : null
        });
      }
    }

    return rows;
  }

  buildDashboardPayload(targets, github, mentions) {
    for (const target of targets) {
      target.uptime = this.getTargetUptime(target.id);
      target.historyBuckets = this.getTargetBuckets(target.id, 168);
    }

    const summary = this.buildSummary(targets, github);
    const uptimeBuckets = targets.map((target) => target.uptime?.h24).filter((value) => value != null);
    summary.fleetUptime24h = uptimeBuckets.length
      ? Math.round(uptimeBuckets.reduce((sum, value) => sum + value, 0) / uptimeBuckets.length * 100) / 100
      : null;

    return {
      generatedAt: nowIso(),
      github,
      mentions,
      summary,
      targets,
      analytics: this.getAnalyticsSummary(),
      alerts: {
        active: this.getActiveIncidents(),
        recent: this.getRecentAlerts(20)
      },
      triggers: this.triggersData.triggers.filter((trigger) => trigger.status !== "resolved").slice(-20),
      scheduler: this.getAdminSchedulerState()
    };
  }

  buildSnapshotMeta(overrides = {}) {
    return {
      generatedBy: "Operations job",
      mode: "snapshot",
      repo: GITHUB_REPO,
      ...overrides
    };
  }

  async archivePublishedSnapshot(snapshot) {
    const snapshotId = buildSnapshotArchiveId(snapshot?.snapshotMeta?.publishedAt ?? snapshot?.generatedAt ?? nowIso());
    const historyIndex = await this.fileRepository.readSnapshotHistoryIndex();
    const existingSnapshots = Array.isArray(historyIndex?.snapshots) ? historyIndex.snapshots : [];
    const nextSnapshots = [
      {
        id: snapshotId,
        date: snapshot?.generatedAt ?? snapshot?.snapshotMeta?.publishedAt ?? nowIso(),
        message: snapshot?.snapshotMeta?.reason || "Published snapshot"
      },
      ...existingSnapshots.filter((entry) => entry.id !== snapshotId)
    ]
      .sort((left, right) => Date.parse(right.date || 0) - Date.parse(left.date || 0));

    const keptSnapshots = nextSnapshots.slice(0, SNAPSHOT_HISTORY_LIMIT);
    const removedSnapshots = nextSnapshots.slice(SNAPSHOT_HISTORY_LIMIT);

    await this.fileRepository.writeHistoricalSnapshot(snapshotId, snapshot);
    await this.fileRepository.writeSnapshotHistoryIndex({
      updatedAt: nowIso(),
      snapshots: keptSnapshots
    });

    await Promise.all(removedSnapshots.map((entry) => this.fileRepository.removeHistoricalSnapshot(entry.id)));
  }

  async publishSnapshot(payload, {
    actor = "system",
    source = "job",
    requestId = null,
    jobId = null,
    reason = null
  } = {}) {
    const publishJob = this.createJobRun("publish", source, actor, requestId, { jobId, reason });
    await this.persistJobRun(publishJob);

    try {
      const snapshot = assertSchema(DashboardSnapshotSchema, {
        ...payload,
        snapshotMeta: this.buildSnapshotMeta({
          actor,
          jobId,
          reason,
          publishedAt: nowIso(),
          preservedPreviousData: false
        })
      });

      await this.fileRepository.writePublishedSnapshot(snapshot);
      await this.archivePublishedSnapshot(snapshot);
      this.dashboardCache = {
        value: snapshot,
        fetchedAt: Date.now(),
        promise: null
      };

      await this.finalizeJobRun(publishJob, "succeeded");
      return snapshot;
    } catch (error) {
      await this.finalizeJobRun(publishJob, "failed", error.message);
      throw error;
    }
  }

  async runScanJob({
    actor = "system",
    source = "manual",
    requestId = null,
    force = false,
    publish = true,
    reason = null
  } = {}) {
    if (this.activeScanPromise) {
      return this.activeScanPromise;
    }

    const jobRun = this.createJobRun("scan", source, actor, requestId, { force, publish, reason });

    this.activeScanPromise = (async () => {
      await this.persistJobRun(jobRun);

      const sideEffects = { newAlerts: [], changedTriggers: [] };

      try {
        const [targets, github, mentions] = await Promise.all([
          Promise.all(TARGETS.map((target) => this.checkTarget(target, sideEffects))),
          this.getGitHubSnapshot(force),
          this.getMentionsSnapshot(force)
        ]);

        const payload = this.buildDashboardPayload(targets, github, mentions);
        const previousSnapshot = await this.fileRepository.readPublishedSnapshot();
        const preservePreviousSnapshot =
          this.config.flags.preservePreviousSnapshotOnNetworkFailure &&
          shouldPreservePreviousSnapshot(previousSnapshot, payload);

        this.jobStatus.lastObservedHealthByTarget = Object.fromEntries(
          targets.map((target) => [target.id, target.health.code])
        );

        await this.fileRepository.writeStagedScanResult({
          ...payload,
          snapshotMeta: this.buildSnapshotMeta({
            actor,
            jobId: jobRun.id,
            reason,
            stagedAt: nowIso(),
            preservedPreviousData: preservePreviousSnapshot
          })
        });

        await this.flushOperationalState();

        const latestTargetsById = new Map(targets.map((target) => [target.id, target]));
        await this.supabaseRepository.upsertTargets(targets);
        await this.supabaseRepository.insertHealthChecks(jobRun.id, targets);
        await this.supabaseRepository.upsertDailyUptimeRows(this.buildDailyUptimeRows(latestTargetsById));
        await this.supabaseRepository.upsertVisitorDailyRows(this.buildVisitorDailyRows());

        for (const { alert, target } of sideEffects.newAlerts) {
          await this.supabaseRepository.insertIncident(alert, target);

          if (alert.type === "recovery") {
            await this.supabaseRepository.resolveOpenIncidents(alert.targetId, alert.timestamp);
          }
        }

        for (const trigger of sideEffects.changedTriggers) {
          await this.supabaseRepository.upsertTrigger(trigger);
        }

        if (publish && !preservePreviousSnapshot) {
          await this.publishSnapshot(payload, {
            actor,
            source,
            requestId,
            jobId: jobRun.id,
            reason
          });
        }

        await this.finalizeJobRun(jobRun, "succeeded", null, {
          targetCount: targets.length,
          published: Boolean(publish && !preservePreviousSnapshot),
          preservedPreviousSnapshot: preservePreviousSnapshot
        });

        return {
          job: clone(jobRun),
          payload,
          published: Boolean(publish && !preservePreviousSnapshot),
          preservedPreviousSnapshot: preservePreviousSnapshot
        };
      } catch (error) {
        await this.finalizeJobRun(jobRun, "failed", error.message);
        throw error;
      } finally {
        this.activeScanPromise = null;
      }
    })();

    return this.activeScanPromise;
  }

  async publishStagedSnapshot({
    actor = "system",
    source = "manual",
    requestId = null,
    reason = null
  } = {}) {
    const staged = await this.fileRepository.readStagedScanResult();

    if (!staged) {
      throw new Error("No staged scan result is available.");
    }

    return this.publishSnapshot(staged, {
      actor,
      source,
      requestId,
      reason
    });
  }

  getTriggers(status = "open") {
    return this.triggersData.triggers.filter((trigger) => trigger.status === status);
  }

  async claimTrigger(triggerId, claimedBy, actor = "operator") {
    const trigger = this.triggersData.triggers.find((item) => item.id === triggerId);

    if (!trigger) {
      const error = new Error("Trigger not found");
      error.code = "TRIGGER_NOT_FOUND";
      throw error;
    }

    trigger.status = "claimed";
    trigger.claimedBy = claimedBy;
    trigger.auditLog = [
      ...(trigger.auditLog || []),
      {
        actor,
        action: "claimed",
        at: nowIso(),
        claimedBy
      }
    ];

    await this.fileRepository.writeTriggers(this.triggersData);
    await this.supabaseRepository.upsertTrigger(trigger);
    return clone(trigger);
  }

  async resolveTrigger(triggerId, resolution, actor = "operator") {
    const trigger = this.triggersData.triggers.find((item) => item.id === triggerId);

    if (!trigger) {
      const error = new Error("Trigger not found");
      error.code = "TRIGGER_NOT_FOUND";
      throw error;
    }

    trigger.status = "resolved";
    trigger.resolvedAt = nowIso();
    trigger.resolution = resolution;
    trigger.auditLog = [
      ...(trigger.auditLog || []),
      {
        actor,
        action: "resolved",
        at: trigger.resolvedAt,
        resolution
      }
    ];

    await this.fileRepository.writeTriggers(this.triggersData);
    await this.supabaseRepository.upsertTrigger(trigger);
    return clone(trigger);
  }

  async getSnapshotCommits() {
    if (this.snapshotCommitsCache.value && Date.now() - this.snapshotCommitsCache.fetchedAt < 10 * 60_000) {
      return this.snapshotCommitsCache.value;
    }

    const commits = await this.fetchJson(
      `https://api.github.com/repos/${GITHUB_REPO}/commits?path=${SNAPSHOT_COMMITS_PATH}&per_page=30`
    );

    const result = commits.map((commit) => ({
      sha: commit.sha,
      date: commit.commit?.committer?.date || commit.commit?.author?.date,
      message: commit.commit?.message?.split("\n")[0] || ""
    }));

    this.snapshotCommitsCache = { value: result, fetchedAt: Date.now() };
    return result;
  }

  async getHistoricalSnapshot(sha) {
    if (this.historicalSnapshotCache.has(sha)) {
      return this.historicalSnapshotCache.get(sha);
    }

    const raw = await this.fetchText(
      `https://raw.githubusercontent.com/${GITHUB_REPO}/${sha}/${SNAPSHOT_COMMITS_PATH}`,
      { accept: "application/json" }
    );
    const data = JSON.parse(raw);

    this.historicalSnapshotCache.set(sha, data);

    if (this.historicalSnapshotCache.size > 15) {
      const oldest = this.historicalSnapshotCache.keys().next().value;
      this.historicalSnapshotCache.delete(oldest);
    }

    return data;
  }

  async backfillToSupabase({
    actor = "system",
    source = "backfill",
    requestId = null
  } = {}) {
    const jobRun = this.createJobRun("backfill", source, actor, requestId, {});
    await this.persistJobRun(jobRun);

    try {
      const snapshot = await this.fileRepository.readPublishedSnapshot();
      const targets = snapshot?.targets?.length ? snapshot.targets : TARGETS;
      const targetsById = new Map(targets.map((target) => [target.id, target]));

      await this.supabaseRepository.upsertTargets(targets);
      await this.supabaseRepository.upsertDailyUptimeRows(this.buildDailyUptimeRows(targetsById, { allDays: true }));
      await this.supabaseRepository.upsertVisitorDailyRows(this.buildVisitorDailyRows({ allDays: true }));

      const healthChecks = [];

      for (const target of snapshot?.targets ?? []) {
        for (const point of target.history ?? []) {
          healthChecks.push({
            id: `${target.id}:${point.at}`,
            checkedAt: point.at,
            statusCode: point.statusCode,
            health: { code: point.health, label: point.health, reason: null },
            responseTimeMs: point.responseTimeMs,
            finalUrl: target.finalUrl || target.url,
            hostname: target.hostname || null,
            platform: target.platform || null,
            metadata: target.metadata || {},
            url: target.url,
            targetId: target.id
          });
        }
      }

      if (healthChecks.length) {
        await this.supabaseRepository.insertHealthChecks("backfill", healthChecks.map((entry) => ({
          ...entry,
          id: entry.targetId,
          checkedAt: entry.checkedAt,
          health: entry.health
        })));
      }

      for (const alert of this.alertsData.alerts) {
        const target = targetsById.get(alert.targetId) || null;
        await this.supabaseRepository.insertIncident(alert, target);

        if (alert.resolvedAt) {
          await this.supabaseRepository.resolveOpenIncidents(alert.targetId, alert.resolvedAt);
        }
      }

      for (const trigger of this.triggersData.triggers) {
        await this.supabaseRepository.upsertTrigger(trigger);
      }

      await this.finalizeJobRun(jobRun, "succeeded", null, {
        targetCount: targets.length
      });

      return clone(jobRun);
    } catch (error) {
      await this.finalizeJobRun(jobRun, "failed", error.message);
      throw error;
    }
  }
}

export { MIME_TYPES };
