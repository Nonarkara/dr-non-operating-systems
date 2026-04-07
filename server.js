import { createServer } from "node:http";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, "public");
const DATA_DIR = join(PUBLIC_DIR, "data");
const SNAPSHOT_FILE = join(DATA_DIR, "dashboard-snapshot.json");
const HEALTH_HISTORY_FILE = join(DATA_DIR, "health-history.json");
const ANALYTICS_FILE = join(DATA_DIR, "analytics.json");
const ALERTS_FILE = join(DATA_DIR, "alerts.json");
const TRIGGERS_FILE = join(DATA_DIR, "triggers.json");
const HOST = process.env.HOST || (process.env.RENDER ? "0.0.0.0" : "127.0.0.1");
const PORT = Number(process.env.PORT || 4178);
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";
const SHEETS_WEBHOOK_URL = process.env.SHEETS_WEBHOOK_URL || "";

const GITHUB_USERNAME = "Nonarkara";
const GITHUB_REPO = "Nonarkara/dr-non-operating-systems";
const SNAPSHOT_COMMITS_PATH = "public/data/dashboard-snapshot.json";
const DASHBOARD_TTL_MS = 20_000;
const GITHUB_TTL_MS = 10 * 60_000;
const MENTIONS_TTL_MS = 30 * 60_000;
const REPO_TTL_MS = 10 * 60_000;
const STALE_SNAPSHOT_MS = 24 * 60 * 60_000;
const SAMPLE_LIMIT = 36;
const MENTION_ITEM_LIMIT = 6;

/* Phase 1 — Persistent history */
const HISTORY_BUCKET_LIMIT = 720;
const HISTORY_FLUSH_MS = 5 * 60_000;

/* Phase 2 — Scheduler */
const SCHEDULER_BUSINESS_INTERVAL_MS = 10 * 60_000;
const SCHEDULER_QUIET_INTERVAL_MS = 60 * 60_000;
const SCHEDULER_TIMEZONE = "Asia/Bangkok";
const SCHEDULER_BUSINESS_START = 8;
const SCHEDULER_BUSINESS_END = 20;

/* Phase 3 — Analytics */
const ANALYTICS_FLUSH_MS = 5 * 60_000;
const ANALYTICS_RETENTION_DAYS = 90;
const GEO_CACHE_TTL_MS = 24 * 60 * 60_000;
const GEO_BATCH_DELAY_MS = 1500;

/* Phase 4 — Alerts */
const ALERT_COOLDOWN_MS = 30 * 60_000;
const ALERT_LIMIT = 500;

/* Phase 5 — Triggers */
const TRIGGER_DELAY_MS = 5 * 60_000;
const TRIGGER_LIMIT = 100;
const MENTION_ALIASES = [
  "Dr Non Arkaraprasertkul",
  "นน อัครประเสริฐกุล",
  "Non Arkara",
  "นนท์ อัครประเสริฐกุล"
];
const MENTION_QUERY = MENTION_ALIASES.map((alias) => `"${alias}"`).join(" OR ");
const MENTION_SOURCE = "Google News";
const MENTION_FEEDS = [
  {
    id: "global",
    label: "Global sweep",
    locale: {
      ceid: "US:en",
      gl: "US",
      hl: "en-US"
    }
  },
  {
    id: "thailand",
    label: "Thailand sweep",
    locale: {
      ceid: "TH:th",
      gl: "TH",
      hl: "th"
    }
  }
];

const TARGETS = [
  {
    id: "middle-east-monitor",
    label: "War Monitor",
    url: "https://nonarkara.github.io/middleeast-monitor/",
    description: "Regional conflict monitoring — Dr Non's GlobeWatch System. Real-time fire detection, market radar, diplomacy tracker.",
    screenshot: "./screenshots/middle-east-monitor.jpg",
    repo: "Nonarkara/middleeast-monitor",
    category: "Monitoring",
    featured: true,
    surface: "static",
    addedAt: "2025-01-10"
  },
  {
    id: "geopolitics-dashboard",
    label: "GPD",
    url: "https://nonarkara.github.io/tech-monitor/",
    description: "Global Political Dashboard — geopolitical intelligence with satellite imagery, conflict data, and cross-border analysis.",
    screenshot: "./screenshots/geopolitics-dashboard.jpg",
    repo: "Nonarkara/tech-monitor",
    category: "Monitoring",
    featured: true,
    surface: "static",
    addedAt: "2025-02-15"
  },
  {
    id: "mem-by-non",
    label: "MEM by NON",
    url: "https://nonarkara.github.io/mem-by-non/",
    description: "Middle East Monitor — regional intelligence dashboard by Dr Non.",
    repo: "Nonarkara/mem-by-non",
    category: "Monitoring",
    featured: true,
    surface: "static",
    addedAt: "2026-04-07"
  },
  {
    id: "phuket-dashboard",
    label: "Phuket Island Command",
    url: "https://phuket-dashboard.vercel.app",
    description: "Coastal operations dashboard — island chokepoints, flights, marine traffic, and environmental monitoring.",
    screenshot: "./screenshots/phuket-dashboard.jpg",
    category: "Monitoring",
    surface: "active",
    addedAt: "2026-03-13"
  },
  {
    id: "mtt-smart-city-monitor",
    label: "Muang Thong Thani Monitor",
    url: "https://mtt-smart-city-monitor-web.onrender.com",
    description: "IMPACT Muang Thong Thani smart city dashboard — PM2.5 guidance, city signals, and resilience monitoring.",
    screenshot: "./screenshots/mtt-smart-city-monitor.jpg",
    category: "Monitoring",
    surface: "active",
    addedAt: "2025-03-08"
  },
  {
    id: "slic-index-v2",
    label: "SLIC Index 2026",
    url: "https://nonarkara.github.io/slic-index-V2/",
    description: "Smart Liveable Cities Index — 157 cities ranked across 5 dimensions with interactive spider diagrams.",
    screenshot: "./screenshots/slic-index-v2.jpg",
    repo: "Nonarkara/slic-index-V2",
    category: "Index",
    featured: true,
    surface: "static",
    addedAt: "2026-03-14"
  },
  {
    id: "sabai-sabai",
    label: "Sabai Sabai",
    url: "https://sabai-sabai-4uh.pages.dev",
    description: "Sabai Sabai platform on Cloudflare Pages.",
    category: "Platform",
    surface: "active",
    addedAt: "2026-03-26"
  },
  {
    id: "city-tech-atlas",
    label: "City Tech Atlas",
    url: "https://citytechatlas.lovable.app",
    description: "Lovable-hosted smart city solution atlas.",
    category: "Directory",
    surface: "active",
    addedAt: "2025-03-12"
  },
  {
    id: "scl-landing-page",
    label: "SCL Landing Page",
    url: "https://nonarkara.github.io/scl-landing-page/",
    description: "depa Smart City Leadership launch page.",
    repo: "Nonarkara/scl-landing-page",
    category: "Landing page",
    surface: "static",
    addedAt: "2024-11-15"
  },
  {
    id: "raat",
    label: "RAAT",
    url: "https://nonarkara.github.io/RAAT/index.html?lang=en",
    description: "Royal Automobile Association of Thailand public site.",
    repo: "Nonarkara/RAAT",
    category: "Website",
    surface: "static",
    addedAt: "2025-03-11"
  },
  {
    id: "techhuntthailand-viabus",
    label: "Tech Hunt Thailand / Viabus",
    url: "https://nonarkara.github.io/techhuntthailand/?id=mobility-cohort-001-viabus",
    description: "Tech Hunt Thailand mobility solution detail page for Viabus.",
    repo: "Nonarkara/techhuntthailand",
    category: "Directory",
    surface: "static",
    addedAt: "2025-03-13"
  },
  {
    id: "ascn-smart-cities-network",
    label: "ASCN Smart Cities Network",
    url: "https://nonarkara.github.io/ascn-smart-cities-network/",
    description: "ASEAN Smart Cities Network public-facing site and resource surface.",
    repo: "Nonarkara/ascn-smart-cities-network",
    category: "Network",
    surface: "static",
    addedAt: "2025-03-13"
  },
  {
    id: "asean-csco-app",
    label: "ASEAN CSCO App",
    url: "https://nonarkara.github.io/asean-csco-app/#manifesto",
    description: "ASEAN CSCO App manifesto page on GitHub Pages.",
    category: "Manifesto",
    surface: "static",
    addedAt: "2025-03-13"
  },
  {
    id: "geopolitics-dashboard",
    label: "Global Geopolitics Dashboard",
    url: "https://global-political-dashboard.netlify.app",
    description: "Geopolitical intelligence dashboard on Netlify.",
    category: "Monitoring",
    surface: "active",
    addedAt: "2025-02-15"
  },
  {
    id: "middle-east-monitor",
    label: "Middle East War Monitor",
    url: "https://middleeast-war-monitor.netlify.app",
    description: "Regional conflict monitoring dashboard — Dr Non's GlobeWatch System on Netlify.",
    category: "Monitoring",
    featured: true,
    surface: "active",
    addedAt: "2025-01-10"
  }
];

const API_INVENTORY = {
  "middle-east-monitor": [],
  "geopolitics-dashboard": [],
  "mem-by-non": [],
  "phuket-dashboard": [],
  "mtt-smart-city-monitor": [],
  "slic-index-v2": [],
  "sabai-sabai": [],
  "city-tech-atlas": [],
  "scl-landing-page": [],
  raat: [],
  "techhuntthailand-viabus": [],
  "ascn-smart-cities-network": [],
  "asean-csco-app": []
};

const historyByTarget = new Map();
const repoCache = new Map();

let dashboardCache = {
  value: null,
  fetchedAt: 0,
  promise: null
};

let githubCache = {
  value: null,
  fetchedAt: 0,
  promise: null
};

let mentionsCache = {
  value: null,
  fetchedAt: 0,
  promise: null
};

/* v4 — Time travel caches */
let snapshotCommitsCache = { value: null, fetchedAt: 0 };
const historicalSnapshotCache = new Map();

/* Phase 1 — Persistent health history (hourly buckets per target) */
const healthHistory = { targets: {}, updatedAt: null };

/* Phase 2 — Scheduler state */
const scheduler = {
  enabled: true,
  timer: null,
  lastCheckAt: null,
  nextCheckAt: null,
  checksToday: 0,
  lastDay: null
};

/* Phase 3 — Visitor analytics */
const analyticsData = { projects: {} };
const geoCache = new Map();
const geoPending = new Set();

/* Phase 4 — Alerts */
const alertsData = { alerts: [] };
const previousHealthByTarget = new Map();
const alertCooldowns = new Map();

/* Phase 5 — Triggers */
const triggersData = { triggers: [] };
const downSince = new Map();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "text/plain; charset=utf-8"
  });
  response.end(body);
}

function safeFilePath(pathname) {
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

  const fullPath = join(PUBLIC_DIR, normalized);
  return fullPath.startsWith(PUBLIC_DIR) ? fullPath : null;
}

function isLocalLikeHost(hostname) {
  if (!hostname) {
    return false;
  }

  const normalized = hostname.replace(/^\[/, "").replace(/\]$/, "");

  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (/^10\./.test(normalized) || /^192\.168\./.test(normalized)) {
    return true;
  }

  const match = normalized.match(/^172\.(\d{1,2})\./);

  if (!match) {
    return false;
  }

  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}

function allowLiveScan(request) {
  const hostHeader = request.headers.host || "";
  const hostname = hostHeader.replace(/:\d+$/, "");
  return isLocalLikeHost(hostname);
}

async function serveStatic(pathname, response) {
  const fullPath = safeFilePath(pathname);

  if (!fullPath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const file = await readFile(fullPath);
    response.writeHead(200, {
      "cache-control": pathname === "/" ? "no-store" : "public, max-age=300",
      "content-type": MIME_TYPES[extname(fullPath)] || "application/octet-stream"
    });
    response.end(file);
  } catch (error) {
    if (pathname !== "/" && pathname !== "/index.html") {
      sendText(response, 404, "Not found");
      return;
    }

    sendText(response, 500, "Unable to load dashboard");
  }
}

async function sendSnapshotJson(response) {
  try {
    const snapshot = await readSnapshotPayload();
    sendJson(response, 200, snapshot);
  } catch (error) {
    sendJson(response, 503, {
      error: "Snapshot file unavailable",
      status: "error"
    });
  }
}

async function readSnapshotPayload() {
  return JSON.parse(await readFile(SNAPSHOT_FILE, "utf8"));
}

async function sendSnapshotMentions(response) {
  try {
    const snapshot = await readSnapshotPayload();
    sendJson(response, 200, snapshot.mentions ?? buildMentionsSnapshot({
      checkedAt: snapshot.generatedAt ?? null,
      error: "Mention snapshot unavailable.",
      status: "offline"
    }));
  } catch (error) {
    sendJson(response, 503, buildMentionsSnapshot({
      error: "Snapshot file unavailable.",
      status: "offline"
    }));
  }
}

function buildHealthPayload(payload, mode) {
  const issues = payload?.summary?.issues ?? [];
  const generatedAtMs = payload?.generatedAt ? Date.parse(payload.generatedAt) : Number.NaN;
  const snapshotAgeMs = Number.isFinite(generatedAtMs) ? Date.now() - generatedAtMs : null;
  const snapshotStale = mode === "snapshot" && (snapshotAgeMs === null || snapshotAgeMs > STALE_SNAPSHOT_MS);
  const githubStatus = payload?.github?.status ?? "unknown";
  const mentionsStatus = payload?.mentions?.status ?? "unknown";
  const status = snapshotStale || issues.length || githubStatus === "offline" || mentionsStatus === "offline"
    ? "degraded"
    : "ok";

  return {
    service: "non-operations-radar",
    status,
    mode,
    time: new Date().toISOString(),
    generatedAt: payload?.generatedAt ?? null,
    snapshotAgeMs: mode === "snapshot" ? snapshotAgeMs : null,
    summary: payload?.summary
      ? {
          attentionCount: payload.summary.attentionCount,
          liveCount: payload.summary.liveCount,
          monitoredPages: payload.summary.monitoredPages,
          fleetUptime24h: payload.summary.fleetUptime24h ?? null
        }
      : null,
    activeIncidents: getActiveIncidents().length,
    dependencies: {
      github: githubStatus,
      mentions: mentionsStatus
    },
    issues: issues.slice(0, 5)
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

function normalizeMentionTitle(title, source) {
  if (!title) {
    return title;
  }

  const suffix = source ? ` - ${source}` : "";
  return suffix && title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

function parseMentionFeed(xml, feedLabel) {
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];

  return itemBlocks
    .map((block) => {
      const rawTitle = decodeHtmlEntities(extractXmlTag(block, "title") || "");
      const link = decodeHtmlEntities(extractXmlTag(block, "link") || "");
      const guid = decodeHtmlEntities(extractXmlTag(block, "guid") || "");
      const source = decodeHtmlEntities(extractXmlTag(block, "source") || "");
      const pubDate = decodeHtmlEntities(extractXmlTag(block, "pubDate") || "");
      const summary = stripHtmlTags(extractXmlTag(block, "description") || "");
      const publishedAtMs = pubDate ? Date.parse(pubDate) : Number.NaN;
      const publishedAt = Number.isFinite(publishedAtMs) ? new Date(publishedAtMs).toISOString() : null;

      if (!rawTitle || !link || !publishedAt) {
        return null;
      }

      return {
        feed: feedLabel,
        id: guid || `${source}:${rawTitle}:${publishedAt}`,
        link,
        publishedAt,
        source: source || "Unknown source",
        summary,
        title: normalizeMentionTitle(rawTitle, source)
      };
    })
    .filter(Boolean);
}

function detectPlatform(urlString, headers = {}) {
  const hostname = new URL(urlString).hostname.toLowerCase();
  const serverHeader = `${headers.server || ""} ${headers["x-render-origin-server"] || ""}`.toLowerCase();

  if (hostname.endsWith("github.io") || serverHeader.includes("github.com")) {
    return "GitHub Pages";
  }

  if (hostname.endsWith("onrender.com") || headers["rndr-id"] || headers["x-render-origin-server"]) {
    return "Render";
  }

  if (hostname.endsWith("lovable.app")) {
    return "Lovable";
  }

  if (hostname === "github.com" || hostname === "api.github.com") {
    return "GitHub";
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "Local";
  }

  return "Web";
}

function recordHistory(targetId, point) {
  const points = historyByTarget.get(targetId) ?? [];
  points.push(point);

  while (points.length > SAMPLE_LIMIT) {
    points.shift();
  }

  historyByTarget.set(targetId, points);
}

function median(numbers) {
  if (!numbers.length) {
    return null;
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[midpoint - 1] + sorted[midpoint]) / 2)
    : sorted[midpoint];
}

function buildApiInventory(target, baseUrl) {
  const baseOrigin = new URL(baseUrl).origin;
  const apis = API_INVENTORY[target.id] ?? [];

  return apis.map((api) => ({
    kind: api.kind,
    label: api.label,
    url: api.url.startsWith("http") ? api.url : new URL(api.url, baseOrigin).toString()
  }));
}

/* ============================================================
   Phase 1 — Persistent Health History
   ============================================================ */

function getHourKey(date = new Date()) {
  return date.toISOString().slice(0, 13);
}

function recordHistoryBucket(targetId, ok, responseTimeMs) {
  if (!healthHistory.targets[targetId]) {
    healthHistory.targets[targetId] = { buckets: [] };
  }

  const buckets = healthHistory.targets[targetId].buckets;
  const hour = getHourKey();
  let current = buckets[buckets.length - 1];

  if (!current || current.hour !== hour) {
    current = { hour, checks: 0, ups: 0, totalMs: 0, minMs: null, maxMs: null };
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

  if (!current.totalBytes) current.totalBytes = 0;
  if (!current.responseTimes) current.responseTimes = [];

  while (buckets.length > HISTORY_BUCKET_LIMIT) {
    buckets.shift();
  }
}

function computeUptime(buckets, hours) {
  const cutoff = new Date(Date.now() - hours * 3600_000).toISOString().slice(0, 13);
  const relevant = buckets.filter((b) => b.hour >= cutoff);

  if (!relevant.length) {
    return null;
  }

  const totalChecks = relevant.reduce((s, b) => s + b.checks, 0);
  const totalUps = relevant.reduce((s, b) => s + b.ups, 0);
  return totalChecks > 0 ? Math.round((totalUps / totalChecks) * 10000) / 100 : null;
}

function getTargetUptime(targetId) {
  const entry = healthHistory.targets[targetId];

  if (!entry) {
    return { h24: null, d7: null, d30: null };
  }

  return {
    h24: computeUptime(entry.buckets, 24),
    d7: computeUptime(entry.buckets, 168),
    d30: computeUptime(entry.buckets, 720)
  };
}

function getTargetBuckets(targetId, hours = 168) {
  const entry = healthHistory.targets[targetId];

  if (!entry) {
    return [];
  }

  const cutoff = new Date(Date.now() - hours * 3600_000).toISOString().slice(0, 13);
  return entry.buckets
    .filter((b) => b.hour >= cutoff)
    .map((b) => ({
      hour: b.hour,
      checks: b.checks,
      ups: b.ups,
      avgMs: b.checks > 0 ? Math.round(b.totalMs / b.checks) : null,
      minMs: b.minMs,
      maxMs: b.maxMs
    }));
}

async function atomicWrite(filePath, data) {
  const tmp = filePath + ".tmp";

  try {
    await writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
    await rename(tmp, filePath);
  } catch (error) {
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(tmp).catch(() => {});
    } catch {}

    console.error(`Failed to write ${filePath}: ${error.message}`);
  }
}

async function loadHealthHistory() {
  try {
    const raw = JSON.parse(await readFile(HEALTH_HISTORY_FILE, "utf8"));

    if (raw?.targets) {
      Object.assign(healthHistory.targets, raw.targets);
      healthHistory.updatedAt = raw.updatedAt || null;
    }
  } catch {}
}

async function flushHealthHistory() {
  healthHistory.updatedAt = new Date().toISOString();
  await atomicWrite(HEALTH_HISTORY_FILE, healthHistory);
}

function startHealthHistoryFlush() {
  if (process.env.NO_LISTEN === "1") {
    return;
  }

  const loop = async () => {
    await flushHealthHistory();
    setTimeout(loop, HISTORY_FLUSH_MS);
  };

  setTimeout(loop, HISTORY_FLUSH_MS);
}

/* ============================================================
   Phase 2 — Scheduled Health Checks
   ============================================================ */

function getBangkokHour() {
  const hour = Number(
    new Date().toLocaleString("en-US", {
      timeZone: SCHEDULER_TIMEZONE,
      hour: "numeric",
      hour12: false
    })
  );

  return hour;
}

function isBusinessHours() {
  const hour = getBangkokHour();
  return hour >= SCHEDULER_BUSINESS_START && hour < SCHEDULER_BUSINESS_END;
}

function getSchedulerInterval() {
  return isBusinessHours() ? SCHEDULER_BUSINESS_INTERVAL_MS : SCHEDULER_QUIET_INTERVAL_MS;
}

async function runScheduledCheck() {
  if (!scheduler.enabled) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  if (scheduler.lastDay !== today) {
    scheduler.checksToday = 0;
    scheduler.lastDay = today;
  }

  try {
    console.log(`[scheduler] Running ${isBusinessHours() ? "business" : "quiet"}-hours check`);
    const data = await getDashboardData(true);
    scheduler.lastCheckAt = new Date().toISOString();
    scheduler.checksToday++;
    await flushHealthHistory();
    await flushAnalytics();
    await flushAlerts();
    await flushTriggers();

    if (data?.targets) {
      supabaseFlushAllDailyUptime(data.targets).catch(() => {});
      supabaseFlushVisitorDaily().catch(() => {});
      supabaseInsertBandwidthChecks(data.targets).catch(() => {});
      logToSheets(data.targets).catch(() => {});
    }
  } catch (error) {
    console.error(`[scheduler] Check failed: ${error.message}`);
  }

  scheduleNextCheck();
}

function scheduleNextCheck() {
  if (scheduler.timer) {
    clearTimeout(scheduler.timer);
  }

  if (!scheduler.enabled) {
    scheduler.nextCheckAt = null;
    return;
  }

  const interval = getSchedulerInterval();
  scheduler.nextCheckAt = new Date(Date.now() + interval).toISOString();
  scheduler.timer = setTimeout(runScheduledCheck, interval);
}

function startScheduler() {
  if (process.env.NO_LISTEN === "1") {
    return;
  }

  scheduleNextCheck();
}

function getSchedulerState() {
  return {
    enabled: scheduler.enabled,
    intervalMinutes: Math.round(getSchedulerInterval() / 60_000),
    nextCheckAt: scheduler.nextCheckAt,
    lastCheckAt: scheduler.lastCheckAt,
    checksToday: scheduler.checksToday,
    mode: isBusinessHours() ? "business" : "quiet"
  };
}

/* ============================================================
   Phase 3 — Visitor Analytics
   ============================================================ */

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function recordVisit(projectId, ip, path, userAgent, responseMs) {
  if (!analyticsData.projects[projectId]) {
    analyticsData.projects[projectId] = { days: {} };
  }

  const today = getToday();
  const proj = analyticsData.projects[projectId];

  if (!proj.days[today]) {
    proj.days[today] = { visitors: 0, uniqueIps: [], countries: {}, totalMs: 0, requests: 0 };
  }

  const day = proj.days[today];
  day.visitors++;
  day.requests++;

  if (ip && !day.uniqueIps.includes(ip)) {
    day.uniqueIps.push(ip);
  }

  if (responseMs != null) {
    day.totalMs += responseMs;
  }
}

function recordVisitorCountry(projectId, date, country) {
  const proj = analyticsData.projects[projectId];

  if (!proj?.days?.[date]) {
    return;
  }

  const day = proj.days[date];

  if (!day.countries[country]) {
    day.countries[country] = 0;
  }

  day.countries[country]++;
}

async function resolveGeoIp(ip) {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return "Local";
  }

  const cached = geoCache.get(ip);

  if (cached && Date.now() - cached.at < GEO_CACHE_TTL_MS) {
    return cached.country;
  }

  if (geoPending.has(ip)) {
    return "Resolving";
  }

  geoPending.add(ip);

  try {
    const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=country`, {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      const country = data.country || "Unknown";
      geoCache.set(ip, { country, at: Date.now() });
      return country;
    }
  } catch {}

  geoCache.set(ip, { country: "Unknown", at: Date.now() });
  return "Unknown";
}

function getClientIp(request) {
  const forwarded = request.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.socket?.remoteAddress || null;
}

function isAnalyticsExcluded(pathname, userAgent) {
  if (pathname.startsWith("/api/") || pathname.includes(".")) {
    return true;
  }

  if (/bot|crawl|spider|slurp|curl|wget|python|node-fetch|non-operations-radar/i.test(userAgent || "")) {
    return true;
  }

  return false;
}

function pruneAnalytics() {
  const cutoff = new Date(Date.now() - ANALYTICS_RETENTION_DAYS * 86400_000).toISOString().slice(0, 10);

  for (const proj of Object.values(analyticsData.projects)) {
    for (const date of Object.keys(proj.days)) {
      if (date < cutoff) {
        delete proj.days[date];
      }
    }
  }
}

function getAnalyticsSummary() {
  const today = getToday();
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
  const projects = {};
  let fleetTodayVisitors = 0;
  let fleetWeekVisitors = 0;
  const fleetCountries = {};

  for (const [id, proj] of Object.entries(analyticsData.projects)) {
    const todayData = proj.days[today];
    let weekVisitors = 0;
    const projCountries = {};

    for (const [date, day] of Object.entries(proj.days)) {
      if (date >= weekAgo) {
        weekVisitors += day.visitors;

        for (const [country, count] of Object.entries(day.countries)) {
          projCountries[country] = (projCountries[country] || 0) + count;
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
      countries: projCountries
    };
  }

  return {
    fleet: {
      todayVisitors: fleetTodayVisitors,
      weekVisitors: fleetWeekVisitors,
      countries: Object.entries(fleetCountries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }))
    },
    projects
  };
}

async function loadAnalytics() {
  try {
    const raw = JSON.parse(await readFile(ANALYTICS_FILE, "utf8"));

    if (raw?.projects) {
      Object.assign(analyticsData.projects, raw.projects);
    }
  } catch {}
}

async function flushAnalytics() {
  pruneAnalytics();
  await atomicWrite(ANALYTICS_FILE, analyticsData);
}

function startAnalyticsFlush() {
  if (process.env.NO_LISTEN === "1") {
    return;
  }

  const loop = async () => {
    await flushAnalytics();
    setTimeout(loop, ANALYTICS_FLUSH_MS);
  };

  setTimeout(loop, ANALYTICS_FLUSH_MS);
}

/* ============================================================
   Phase 4 — Alerting & Notifications
   ============================================================ */

function detectHealthTransition(targetId, targetLabel, newHealth, featured) {
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

function fireAlert(targetId, targetLabel, transition) {
  const cooldownKey = `${targetId}:${transition.type}`;
  const lastFired = alertCooldowns.get(cooldownKey);

  if (lastFired && Date.now() - lastFired < ALERT_COOLDOWN_MS) {
    return null;
  }

  alertCooldowns.set(cooldownKey, Date.now());

  const alert = {
    id: randomUUID(),
    targetId,
    targetLabel,
    type: transition.type,
    severity: transition.severity,
    message: transition.message,
    timestamp: new Date().toISOString(),
    resolvedAt: transition.type === "recovery" ? new Date().toISOString() : null
  };

  alertsData.alerts.push(alert);

  while (alertsData.alerts.length > ALERT_LIMIT) {
    alertsData.alerts.shift();
  }

  if (transition.type === "recovery") {
    for (const a of alertsData.alerts) {
      if (a.targetId === targetId && !a.resolvedAt && (a.type === "down" || a.type === "degraded")) {
        a.resolvedAt = alert.timestamp;
      }
    }
  }

  console.log(`[alert] ${transition.severity.toUpperCase()}: ${transition.message}`);
  sendWebhook(alert);

  if (transition.type === "recovery") {
    supabaseResolveIncidents(targetId, alert.timestamp).catch(() => {});
  }

  return alert;
}

async function sendWebhook(alert) {
  if (!ALERT_WEBHOOK_URL) {
    return;
  }

  try {
    const color = alert.severity === "critical" ? 16711680 : alert.severity === "warning" ? 16753920 : 65280;

    await fetch(ALERT_WEBHOOK_URL, {
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
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    console.error(`[alert] Webhook failed: ${error.message}`);
  }
}

function getActiveIncidents() {
  return alertsData.alerts.filter(
    (a) => (a.type === "down" || a.type === "degraded") && !a.resolvedAt
  );
}

function getRecentAlerts(limit = 50) {
  return alertsData.alerts.slice(-limit).reverse();
}

async function loadAlerts() {
  try {
    const raw = JSON.parse(await readFile(ALERTS_FILE, "utf8"));

    if (Array.isArray(raw?.alerts)) {
      alertsData.alerts = raw.alerts.slice(-ALERT_LIMIT);
    }
  } catch {}
}

async function flushAlerts() {
  await atomicWrite(ALERTS_FILE, alertsData);
}

/* ============================================================
   Phase 5 — Auto-Debug Triggers
   ============================================================ */

function getSuggestedActions(target) {
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

function maybeCreateTrigger(target, alert) {
  if (alert.type !== "down" || alert.severity !== "critical") {
    return;
  }

  const sinceMs = downSince.get(target.id);
  const now = Date.now();

  if (!sinceMs) {
    downSince.set(target.id, now);
    return;
  }

  if (now - sinceMs < TRIGGER_DELAY_MS) {
    return;
  }

  const existing = triggersData.triggers.find(
    (t) => t.targetId === target.id && t.status === "open"
  );

  if (existing) {
    return;
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
      suggestedActions: getSuggestedActions(target)
    },
    status: "open",
    createdAt: new Date().toISOString(),
    claimedBy: null,
    resolvedAt: null
  };

  triggersData.triggers.push(trigger);

  while (triggersData.triggers.length > TRIGGER_LIMIT) {
    triggersData.triggers.shift();
  }

  console.log(`[trigger] Created trigger for ${target.label}: ${trigger.id}`);
}

function resolveTriggersForTarget(targetId) {
  for (const trigger of triggersData.triggers) {
    if (trigger.targetId === targetId && trigger.status !== "resolved") {
      trigger.status = "resolved";
      trigger.resolvedAt = new Date().toISOString();
    }
  }

  downSince.delete(targetId);
}

async function loadTriggers() {
  try {
    const raw = JSON.parse(await readFile(TRIGGERS_FILE, "utf8"));

    if (Array.isArray(raw?.triggers)) {
      triggersData.triggers = raw.triggers.slice(-TRIGGER_LIMIT);
    }
  } catch {}
}

async function flushTriggers() {
  await atomicWrite(TRIGGERS_FILE, triggersData);
}

/* ============================================================
   Post-check hook — wires phases 1, 4, 5 together
   ============================================================ */

function postCheckHook(target) {
  const ok = target.health.code === "live";

  recordHistoryBucket(target.id, ok, target.responseTimeMs);

  const entry = healthHistory.targets[target.id];
  if (entry) {
    const bucket = entry.buckets[entry.buckets.length - 1];
    if (bucket) {
      bucket.totalBytes = (bucket.totalBytes || 0) + (target.bodyBytes || 0);
      if (!bucket.responseTimes) bucket.responseTimes = [];
      if (target.responseTimeMs != null) bucket.responseTimes.push(target.responseTimeMs);
    }
  }

  const transition = detectHealthTransition(
    target.id,
    target.label,
    target.health.code,
    target.featured
  );

  if (transition) {
    const alert = fireAlert(target.id, target.label, transition);

    if (alert && transition.type === "down") {
      maybeCreateTrigger(target, alert);
      supabaseInsertIncident(alert, target).catch(() => {});
    }

    if (alert && transition.type === "degraded") {
      supabaseInsertIncident(alert, target).catch(() => {});
    }

    if (transition.type === "recovery") {
      resolveTriggersForTarget(target.id);
    }
  }
}

/* ============================================================
   Supabase — Long-term persistent monitoring database
   Zero dependencies: uses native fetch to Supabase REST API.
   Falls back silently if SUPABASE_URL is not set.
   ============================================================ */

function supabaseEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function supabaseRequest(table, method, body, query = "") {
  if (!supabaseEnabled()) {
    return null;
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${SUPABASE_KEY}`,
        "content-type": "application/json",
        prefer: method === "POST" ? "resolution=merge-duplicates,return=minimal" : "return=minimal"
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(`[supabase] ${method} ${table} failed: ${response.status} ${text.slice(0, 200)}`);
    }

    return response;
  } catch (error) {
    console.error(`[supabase] ${method} ${table} error: ${error.message}`);
    return null;
  }
}

async function supabaseUpsertDailyUptime(target) {
  const today = new Date().toISOString().slice(0, 10);
  const ok = target.health?.code === "live";
  const entry = healthHistory.targets[target.id];
  const todayBuckets = entry?.buckets?.filter((b) => b.hour.startsWith(today)) ?? [];
  const checks = todayBuckets.reduce((s, b) => s + b.checks, 0) || (ok ? 1 : 1);
  const ups = todayBuckets.reduce((s, b) => s + b.ups, 0) || (ok ? 1 : 0);
  const totalMs = todayBuckets.reduce((s, b) => s + b.totalMs, 0);
  const minMs = todayBuckets.reduce((m, b) => b.minMs != null && (m === null || b.minMs < m) ? b.minMs : m, null);
  const maxMs = todayBuckets.reduce((m, b) => b.maxMs != null && (m === null || b.maxMs > m) ? b.maxMs : m, null);

  const allResponseTimes = todayBuckets.flatMap((b) => b.responseTimes || []);
  const totalBytes = todayBuckets.reduce((s, b) => s + (b.totalBytes || 0), 0);
  const cacheHits = todayBuckets.reduce((s, b) => s + (b.cacheHits || 0), 0);
  const errorCount = checks - ups;

  await supabaseRequest("daily_uptime", "POST", {
    target_id: target.id,
    target_label: target.label,
    date: today,
    checks,
    ups,
    avg_response_ms: checks > 0 ? Math.round(totalMs / checks) : null,
    min_response_ms: minMs,
    max_response_ms: maxMs,
    p50_ms: computePercentile(allResponseTimes, 50),
    p95_ms: computePercentile(allResponseTimes, 95),
    avg_bytes: checks > 0 ? Math.round(totalBytes / checks) : null,
    total_bytes: totalBytes || null,
    cache_hit_pct: checks > 0 ? Math.round((cacheHits / checks) * 10000) / 100 : null,
    error_count: errorCount,
    platform: target.platform || null,
    surface: target.surface || null,
    category: target.category || null
  }, "?on_conflict=target_id,date");
}

async function supabaseInsertIncident(alert, target) {
  await supabaseRequest("incidents", "POST", {
    target_id: alert.targetId,
    target_label: alert.targetLabel,
    severity: alert.severity,
    type: alert.type,
    message: alert.message,
    platform: target?.platform || null,
    error_reason: target?.health?.reason || null,
    started_at: alert.timestamp,
    resolved_at: alert.resolvedAt || null
  });
}

async function supabaseResolveIncidents(targetId, resolvedAt) {
  await supabaseRequest(
    "incidents",
    "PATCH",
    { resolved_at: resolvedAt },
    `?target_id=eq.${encodeURIComponent(targetId)}&resolved_at=is.null`
  );
}

async function supabaseUpsertVisitorDaily(projectId) {
  const today = new Date().toISOString().slice(0, 10);
  const proj = analyticsData.projects[projectId];
  const dayData = proj?.days?.[today];

  if (!dayData) {
    return;
  }

  await supabaseRequest("visitor_daily", "POST", {
    project_id: projectId,
    date: today,
    visitors: dayData.visitors || 0,
    unique_ips: dayData.uniqueIps?.length || 0,
    top_countries: dayData.countries || {},
    avg_response_ms: dayData.requests ? Math.round(dayData.totalMs / dayData.requests) : null
  }, "?on_conflict=project_id,date");
}

async function supabaseFlushAllDailyUptime(targets) {
  if (!supabaseEnabled()) {
    return;
  }

  for (const target of targets) {
    await supabaseUpsertDailyUptime(target);
  }

  console.log(`[supabase] Flushed daily uptime for ${targets.length} targets`);
}

async function supabaseFlushVisitorDaily() {
  if (!supabaseEnabled()) {
    return;
  }

  for (const projectId of Object.keys(analyticsData.projects)) {
    await supabaseUpsertVisitorDaily(projectId);
  }
}

/* ============================================================
   Bandwidth Telemetry — Google Sheets + Supabase
   ============================================================ */

async function logToSheets(targets) {
  if (!SHEETS_WEBHOOK_URL) return;

  const checks = targets.map((t) => ({
    timestamp: t.checkedAt,
    target_id: t.id,
    target_label: t.label,
    platform: t.platform || "",
    status_code: t.statusCode ?? "",
    health: t.health?.code || "offline",
    response_ms: t.responseTimeMs ?? "",
    body_bytes: t.bodyBytes ?? 0,
    content_encoding: t.contentEncoding || "none",
    cache_status: t.cacheStatus || "none",
    error_type: t.errorType || ""
  }));

  try {
    await fetch(SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checks }),
      signal: AbortSignal.timeout(10000)
    });
  } catch (error) {
    console.error(`[sheets] Webhook failed: ${error.message}`);
  }
}

async function supabaseInsertBandwidthChecks(targets) {
  if (!supabaseEnabled()) return;

  const rows = targets.map((t) => ({
    target_id: t.id,
    target_label: t.label,
    platform: t.platform || null,
    checked_at: t.checkedAt,
    status_code: t.statusCode ?? null,
    health: t.health?.code || "offline",
    response_ms: t.responseTimeMs ?? null,
    body_bytes: t.bodyBytes ?? null,
    content_encoding: t.contentEncoding || "none",
    cache_status: t.cacheStatus || "none",
    error_type: t.errorType || null
  }));

  await supabaseRequest("bandwidth_checks", "POST", rows);
}

function computePercentile(arr, pct) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * (pct / 100)) - 1;
  return sorted[Math.max(0, idx)];
}

async function fetchJson(url) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "non-operations-radar"
  };
  const authToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_API_TOKEN;

  if (authToken) {
    headers.authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(12_000)
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed with ${response.status}`);
  }

  return response.json();
}

async function fetchText(url, accept = "application/xml,text/xml;q=0.9,*/*;q=0.8") {
  const response = await fetch(url, {
    headers: {
      accept,
      "user-agent": "non-operations-radar"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000)
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.text();
}

async function getRepoMetadata(repoSlug) {
  const cached = repoCache.get(repoSlug);

  if (cached?.value && Date.now() - cached.fetchedAt < REPO_TTL_MS) {
    return cached.value;
  }

  if (cached?.promise) {
    return cached.promise;
  }

  const promise = (async () => {
    try {
      const repo = await fetchJson(`https://api.github.com/repos/${repoSlug}`);

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

      repoCache.set(repoSlug, {
        value,
        fetchedAt: Date.now(),
        promise: null
      });

      return value;
    } catch (error) {
      repoCache.set(repoSlug, {
        value: {
          error: error.message,
          fullName: repoSlug
        },
        fetchedAt: Date.now(),
        promise: null
      });

      return repoCache.get(repoSlug).value;
    }
  })();

  repoCache.set(repoSlug, {
    value: cached?.value ?? null,
    fetchedAt: cached?.fetchedAt ?? 0,
    promise
  });

  return promise;
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

async function checkTarget(target) {
  const startedAt = Date.now();
  let repo = null;

  if (target.repo) {
    repo = await getRepoMetadata(target.repo);
  }

  try {
    const response = await fetch(target.url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": "non-operations-radar"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000)
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
    const checkedAt = new Date().toISOString();
    const bodyBytes = Number(headers["content-length"]) || body.length || 0;
    const contentEncoding = headers["content-encoding"] || "none";
    const cacheStatus = headers["cf-cache-status"] || headers["x-cache"] || headers["x-vercel-cache"] || "none";
    const errorType = response.ok ? null : response.status >= 500 ? "http_5xx" : "http_4xx";

    recordHistory(target.id, {
      at: checkedAt,
      health: health.code,
      ok: response.ok,
      responseTimeMs,
      statusCode: response.status
    });

    const result = {
      apis: buildApiInventory(target, finalUrl),
      addedAt: target.addedAt,
      bodyBytes,
      category: target.category,
      cacheStatus,
      checkedAt,
      contentEncoding,
      description: target.description,
      errorType,
      finalUrl,
      featured: Boolean(target.featured),
      health,
      history: historyByTarget.get(target.id) ?? [],
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
      screenshot: target.screenshot || null,
      surface: target.surface,
      url: target.url
    };

    postCheckHook(result);
    return result;
  } catch (error) {
    const checkedAt = new Date().toISOString();
    const responseTimeMs = Date.now() - startedAt;

    recordHistory(target.id, {
      at: checkedAt,
      health: "offline",
      ok: false,
      responseTimeMs,
      statusCode: null
    });

    const errType = error.name === "TimeoutError" ? "timeout" : /dns|enotfound|eai_again/i.test(error.message) ? "dns" : /tls|certificate/i.test(error.message) ? "tls" : "network";

    const result = {
      apis: buildApiInventory(target, target.url),
      addedAt: target.addedAt,
      bodyBytes: 0,
      category: target.category,
      cacheStatus: "none",
      checkedAt,
      contentEncoding: "none",
      description: target.description,
      errorType: errType,
      finalUrl: target.url,
      featured: Boolean(target.featured),
      health: {
        code: "offline",
        label: "Offline",
        reason: error.name === "TimeoutError" ? "The check timed out." : error.message
      },
      history: historyByTarget.get(target.id) ?? [],
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
      screenshot: target.screenshot || null,
      surface: target.surface,
      url: target.url
    };

    postCheckHook(result);
    return result;
  }
}

async function getGitHubSnapshot() {
  if (githubCache.value && Date.now() - githubCache.fetchedAt < GITHUB_TTL_MS) {
    return githubCache.value;
  }

  if (githubCache.promise) {
    return githubCache.promise;
  }

  githubCache.promise = (async () => {
    try {
      const [profile, repos] = await Promise.all([
        fetchJson(`https://api.github.com/users/${GITHUB_USERNAME}`),
        fetchJson(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`)
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
        checkedAt: new Date().toISOString(),
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

      githubCache = {
        value: snapshot,
        fetchedAt: Date.now(),
        promise: null
      };

      return snapshot;
    } catch (error) {
      const snapshot = {
        checkedAt: new Date().toISOString(),
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

      githubCache = {
        value: snapshot,
        fetchedAt: Date.now(),
        promise: null
      };

      return snapshot;
    }
  })();

  return githubCache.promise;
}

async function getMentionsSnapshot(force = false) {
  if (!force && mentionsCache.value && Date.now() - mentionsCache.fetchedAt < MENTIONS_TTL_MS) {
    return mentionsCache.value;
  }

  if (mentionsCache.promise) {
    return mentionsCache.promise;
  }

  mentionsCache.promise = (async () => {
    try {
      const results = await Promise.allSettled(
        MENTION_FEEDS.map(async (feed) => {
          const xml = await fetchText(buildMentionFeedUrl(feed.locale));
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
        checkedAt: new Date().toISOString(),
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

      mentionsCache = {
        value: snapshot,
        fetchedAt: Date.now(),
        promise: null
      };

      return snapshot;
    } catch (error) {
      const snapshot = buildMentionsSnapshot({
        checkedAt: new Date().toISOString(),
        error: error.message,
        status: "offline"
      });

      mentionsCache = {
        value: snapshot,
        fetchedAt: Date.now(),
        promise: null
      };

      return snapshot;
    }
  })();

  return mentionsCache.promise;
}

function buildSummary(targets, github) {
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

function hydrateHistoryFromSnapshot(snapshot) {
  historyByTarget.clear();

  for (const target of snapshot?.targets ?? []) {
    if (!Array.isArray(target.history) || !target.id) {
      continue;
    }

    historyByTarget.set(
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

async function getDashboardData(force = false) {
  if (!force && dashboardCache.value && Date.now() - dashboardCache.fetchedAt < DASHBOARD_TTL_MS) {
    return dashboardCache.value;
  }

  if (dashboardCache.promise) {
    return dashboardCache.promise;
  }

  dashboardCache.promise = (async () => {
    const [targets, github, mentions] = await Promise.all([
      Promise.all(TARGETS.map((target) => checkTarget(target))),
      getGitHubSnapshot(),
      getMentionsSnapshot(force)
    ]);

    for (const t of targets) {
      t.uptime = getTargetUptime(t.id);
      t.historyBuckets = getTargetBuckets(t.id, 168);
    }

    const summary = buildSummary(targets, github);

    const uptimeBuckets = targets.map((t) => t.uptime?.h24).filter((v) => v != null);
    summary.fleetUptime24h = uptimeBuckets.length
      ? Math.round(uptimeBuckets.reduce((a, b) => a + b, 0) / uptimeBuckets.length * 100) / 100
      : null;

    const payload = {
      generatedAt: new Date().toISOString(),
      github,
      mentions,
      summary,
      targets,
      bandwidth: {
        totalBytes: targets.reduce((s, t) => s + (t.bodyBytes || 0), 0),
        avgBytes: targets.length ? Math.round(targets.reduce((s, t) => s + (t.bodyBytes || 0), 0) / targets.length) : 0,
        cacheHits: targets.filter((t) => t.cacheStatus && t.cacheStatus !== "none" && t.cacheStatus !== "MISS").length,
        cacheTotal: targets.filter((t) => t.cacheStatus && t.cacheStatus !== "none").length,
        byPlatform: Object.entries(
          targets.reduce((acc, t) => {
            const p = t.platform || "Unknown";
            if (!acc[p]) acc[p] = { bytes: 0, avgMs: 0, count: 0, errors: 0 };
            acc[p].bytes += t.bodyBytes || 0;
            acc[p].avgMs += t.responseTimeMs || 0;
            acc[p].count++;
            if (t.errorType) acc[p].errors++;
            return acc;
          }, {})
        ).map(([platform, d]) => ({ platform, bytes: d.bytes, avgMs: Math.round(d.avgMs / d.count), count: d.count, errors: d.errors }))
      },
      analytics: getAnalyticsSummary(),
      alerts: {
        active: getActiveIncidents(),
        recent: getRecentAlerts(20)
      },
      triggers: triggersData.triggers.filter((t) => t.status !== "resolved").slice(-20),
      scheduler: getSchedulerState()
    };

    dashboardCache = {
      value: payload,
      fetchedAt: Date.now(),
      promise: null
    };

    return payload;
  })().catch((error) => {
    dashboardCache.promise = null;
    throw error;
  });

  return dashboardCache.promise;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);

  if (url.pathname === "/api/health") {
    const liveMode = allowLiveScan(request);

    try {
      const payload = liveMode ? await getDashboardData(false) : await readSnapshotPayload();
      const health = buildHealthPayload(payload, liveMode ? "live" : "snapshot");
      sendJson(response, 200, health);
    } catch (error) {
      sendJson(response, 503, {
        service: "non-operations-radar",
        status: "error",
        mode: liveMode ? "live" : "snapshot",
        time: new Date().toISOString(),
        error: error.message
      });
    }
    return;
  }

  if (url.pathname === "/api/dashboard") {
    if (!allowLiveScan(request)) {
      await sendSnapshotJson(response);
      return;
    }

    try {
      const payload = await getDashboardData(url.searchParams.get("force") === "1");
      sendJson(response, 200, payload);
    } catch (error) {
      sendJson(response, 500, {
        error: error.message,
        status: "error"
      });
    }
    return;
  }

  if (url.pathname === "/api/mentions") {
    if (!allowLiveScan(request)) {
      await sendSnapshotMentions(response);
      return;
    }

    const payload = await getMentionsSnapshot(url.searchParams.get("force") === "1");
    sendJson(response, 200, payload);
    return;
  }

  /* v4 — Time Travel: list snapshot commits */
  if (url.pathname === "/api/snapshots") {
    try {
      if (snapshotCommitsCache.value && Date.now() - snapshotCommitsCache.fetchedAt < 10 * 60_000) {
        sendJson(response, 200, snapshotCommitsCache.value);
        return;
      }

      const commits = await fetchJson(
        `https://api.github.com/repos/${GITHUB_REPO}/commits?path=${SNAPSHOT_COMMITS_PATH}&per_page=30`
      );

      const result = commits.map((c) => ({
        sha: c.sha,
        date: c.commit?.committer?.date || c.commit?.author?.date,
        message: c.commit?.message?.split("\n")[0] || ""
      }));

      snapshotCommitsCache = { value: result, fetchedAt: Date.now() };
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 503, { error: "Could not fetch snapshot history", detail: error.message });
    }
    return;
  }

  /* v4 — Time Travel: fetch a historical snapshot by SHA */
  const snapshotShaMatch = url.pathname.match(/^\/api\/snapshots\/([a-f0-9]{7,40})$/);

  if (snapshotShaMatch) {
    const sha = snapshotShaMatch[1];

    try {
      if (historicalSnapshotCache.has(sha)) {
        sendJson(response, 200, historicalSnapshotCache.get(sha));
        return;
      }

      const raw = await fetchText(
        `https://raw.githubusercontent.com/${GITHUB_REPO}/${sha}/${SNAPSHOT_COMMITS_PATH}`,
        "application/json"
      );

      const data = JSON.parse(raw);
      historicalSnapshotCache.set(sha, data);

      if (historicalSnapshotCache.size > 15) {
        const oldest = historicalSnapshotCache.keys().next().value;
        historicalSnapshotCache.delete(oldest);
      }

      sendJson(response, 200, data);
    } catch (error) {
      sendJson(response, 503, { error: "Could not fetch historical snapshot", detail: error.message });
    }
    return;
  }

  /* Phase 2 — Scheduler endpoints */
  if (url.pathname === "/api/scheduler") {
    if (request.method === "POST") {
      let body = "";

      for await (const chunk of request) {
        body += chunk;
      }

      try {
        const data = JSON.parse(body);

        if (typeof data.enabled === "boolean") {
          scheduler.enabled = data.enabled;

          if (data.enabled) {
            scheduleNextCheck();
          } else if (scheduler.timer) {
            clearTimeout(scheduler.timer);
            scheduler.nextCheckAt = null;
          }
        }
      } catch {}

      sendJson(response, 200, getSchedulerState());
      return;
    }

    sendJson(response, 200, getSchedulerState());
    return;
  }

  /* Phase 3 — Analytics endpoints */
  if (url.pathname === "/api/analytics") {
    sendJson(response, 200, getAnalyticsSummary());
    return;
  }

  if (url.pathname === "/api/beacon" && request.method === "POST") {
    let body = "";

    for await (const chunk of request) {
      body += chunk;
    }

    try {
      const data = JSON.parse(body);
      const projectId = data.projectId || "unknown";
      const ip = data.ip || getClientIp(request);
      const path = data.path || "/";
      const userAgent = data.userAgent || request.headers["user-agent"] || "";
      const responseMs = data.responseMs ?? null;
      const country = data.country || null;

      recordVisit(projectId, ip, path, userAgent, responseMs);

      if (country) {
        recordVisitorCountry(projectId, getToday(), country);
      } else if (ip) {
        resolveGeoIp(ip).then((resolvedCountry) => {
          recordVisitorCountry(projectId, getToday(), resolvedCountry);
        }).catch(() => {});
      }

      sendJson(response, 200, { status: "ok" });
    } catch {
      sendJson(response, 400, { error: "Invalid beacon payload" });
    }
    return;
  }

  /* Phase 4 — Alerts endpoint */
  if (url.pathname === "/api/alerts") {
    sendJson(response, 200, {
      active: getActiveIncidents(),
      recent: getRecentAlerts(50)
    });
    return;
  }

  /* Phase 5 — Triggers endpoints */
  if (url.pathname === "/api/triggers" && request.method === "GET") {
    const statusFilter = url.searchParams.get("status") || "open";
    const filtered = triggersData.triggers.filter((t) => t.status === statusFilter);
    sendJson(response, 200, { triggers: filtered });
    return;
  }

  const triggerClaimMatch = url.pathname.match(/^\/api\/triggers\/([^/]+)\/claim$/);

  if (triggerClaimMatch && request.method === "POST") {
    const triggerId = triggerClaimMatch[1];
    const trigger = triggersData.triggers.find((t) => t.id === triggerId);

    if (!trigger) {
      sendJson(response, 404, { error: "Trigger not found" });
      return;
    }

    let body = "";

    for await (const chunk of request) {
      body += chunk;
    }

    try {
      const data = JSON.parse(body);
      trigger.status = "claimed";
      trigger.claimedBy = data.claimedBy || "unknown";
      await flushTriggers();
      sendJson(response, 200, trigger);
    } catch {
      sendJson(response, 400, { error: "Invalid payload" });
    }
    return;
  }

  const triggerResolveMatch = url.pathname.match(/^\/api\/triggers\/([^/]+)\/resolve$/);

  if (triggerResolveMatch && request.method === "POST") {
    const triggerId = triggerResolveMatch[1];
    const trigger = triggersData.triggers.find((t) => t.id === triggerId);

    if (!trigger) {
      sendJson(response, 404, { error: "Trigger not found" });
      return;
    }

    let body = "";

    for await (const chunk of request) {
      body += chunk;
    }

    try {
      const data = JSON.parse(body);
      trigger.status = "resolved";
      trigger.resolvedAt = new Date().toISOString();
      trigger.resolution = data.resolution || null;
      await flushTriggers();
      sendJson(response, 200, trigger);
    } catch {
      sendJson(response, 400, { error: "Invalid payload" });
    }
    return;
  }

  /* Analytics middleware — track visits to the dashboard itself */
  if (!isAnalyticsExcluded(url.pathname, request.headers["user-agent"])) {
    const ip = getClientIp(request);
    recordVisit("operations-radar", ip, url.pathname, request.headers["user-agent"], null);

    if (ip) {
      resolveGeoIp(ip).then((country) => {
        recordVisitorCountry("operations-radar", getToday(), country);
      }).catch(() => {});
    }
  }

  await serveStatic(url.pathname, response);
});

export {
  getDashboardData,
  getMentionsSnapshot,
  healthHistory,
  hydrateHistoryFromSnapshot,
  analyticsData,
  alertsData,
  triggersData,
  flushHealthHistory,
  flushAnalytics,
  flushAlerts,
  flushTriggers,
  supabaseFlushAllDailyUptime,
  supabaseFlushVisitorDaily,
  server
};

/* Load persistent data and start background loops */
await loadHealthHistory();
await loadAnalytics();
await loadAlerts();
await loadTriggers();

if (process.env.NO_LISTEN !== "1") {
  startHealthHistoryFlush();
  startAnalyticsFlush();
  startScheduler();
  server.listen(PORT, HOST, () => {
    console.log(`Operations radar listening on http://${HOST}:${PORT}`);
    console.log(`[scheduler] ${scheduler.enabled ? "Active" : "Disabled"}, mode: ${isBusinessHours() ? "business" : "quiet"}`);
  });
}
