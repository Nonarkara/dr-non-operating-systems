import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, "public");
const SNAPSHOT_FILE = join(PUBLIC_DIR, "data", "dashboard-snapshot.json");
const HOST = process.env.HOST || (process.env.RENDER ? "0.0.0.0" : "127.0.0.1");
const PORT = Number(process.env.PORT || 4178);

const GITHUB_USERNAME = "Nonarkara";
const DASHBOARD_TTL_MS = 20_000;
const GITHUB_TTL_MS = 10 * 60_000;
const REPO_TTL_MS = 10 * 60_000;
const SAMPLE_LIMIT = 36;

const TARGETS = [
  {
    id: "scl-landing-page",
    label: "SCL Landing Page",
    url: "https://nonarkara.github.io/scl-landing-page/",
    description: "depa Smart City Leadership launch page.",
    repo: "Nonarkara/scl-landing-page",
    category: "Landing page",
    surface: "static"
  },
  {
    id: "middle-east-monitor",
    label: "Middle East Monitor",
    url: "https://middle-east-monitor.onrender.com",
    description: "Regional monitoring dashboard deployed on Render.",
    category: "Monitoring",
    featured: true,
    surface: "active"
  },
  {
    id: "geopolitics-dashboard",
    label: "Geopolitics Dashboard",
    url: "https://geopolitics-dashboard.onrender.com",
    description: "Geopolitical dashboard deployed on Render.",
    category: "Monitoring",
    surface: "active"
  },
  {
    id: "city-reporter-bot",
    label: "City Reporter Bot",
    url: "https://city-reporter-bot.onrender.com",
    description: "Command center and reporting bot interface.",
    category: "Bot",
    surface: "active"
  },
  {
    id: "smart-city-monitor",
    label: "Smart City Monitor",
    url: "https://smart-city-monitor-web.onrender.com/?lang=en&view=city&timeRange=7d&city=bangkok&layers=smart-city-thailand%2Cbangkok-passages%2Cprojects%2Cnews%2Cresilience%2Ceconomy%2Cweather%2Cpollution",
    description: "Bangkok-focused smart city monitor with layered geospatial filters.",
    category: "Monitoring",
    surface: "active"
  },
  {
    id: "mtt-smart-city-monitor",
    label: "MTT Smart City Monitor",
    url: "https://mtt-smart-city-monitor-web.onrender.com",
    description: "IMPACT Muang Thong Thani super dashboard with live city signals, domains, media, and assistant tooling.",
    category: "Monitoring",
    surface: "active"
  },
  {
    id: "phuket-smart-bus",
    label: "Phuket Smart Bus",
    url: "https://phuket-smart-bus-y6tj.onrender.com",
    description: "Phone-first rider prototype with live tracking, advisories, and leave-now guidance.",
    category: "Transit",
    surface: "active"
  },
  {
    id: "raat",
    label: "RAAT",
    url: "https://nonarkara.github.io/RAAT/index.html?lang=en",
    description: "Royal Automobile Association of Thailand public site.",
    repo: "Nonarkara/RAAT",
    category: "Website",
    surface: "static"
  },
  {
    id: "tech-monitor",
    label: "Tech Monitor",
    url: "https://tech-monitor.onrender.com",
    description: "Technology monitoring deployment on Render.",
    category: "Monitoring",
    surface: "active"
  },
  {
    id: "city-tech-atlas",
    label: "City Tech Atlas",
    url: "https://citytechatlas.lovable.app",
    description: "Lovable-hosted smart city solution atlas.",
    category: "Directory",
    surface: "active"
  },
  {
    id: "slic-index-rankings",
    label: "SLIC Index Rankings",
    url: "https://slic-index.onrender.com/rankings",
    description: "Render-hosted SLIC index rankings surface.",
    category: "Index",
    surface: "active"
  },
  {
    id: "techhuntthailand-viabus",
    label: "Tech Hunt Thailand / Viabus",
    url: "https://nonarkara.github.io/techhuntthailand/?id=mobility-cohort-001-viabus",
    description: "Tech Hunt Thailand mobility solution detail page for Viabus.",
    repo: "Nonarkara/techhuntthailand",
    category: "Directory",
    surface: "static"
  },
  {
    id: "ascn-smart-cities-network",
    label: "ASCN Smart Cities Network",
    url: "https://nonarkara.github.io/ascn-smart-cities-network/",
    description: "ASEAN Smart Cities Network public-facing site and resource surface.",
    repo: "Nonarkara/ascn-smart-cities-network",
    category: "Network",
    surface: "static"
  },
  {
    id: "asean-csco-app",
    label: "ASEAN CSCO App",
    url: "https://nonarkara.github.io/asean-csco-app/#manifesto",
    description: "ASEAN CSCO App manifesto page on GitHub Pages.",
    category: "Manifesto",
    surface: "static"
  },
  {
    id: "airdnd-platform",
    label: "AirDnD Platform",
    url: "https://airdnd-platform.onrender.com",
    description: "AirDnD public platform deployment.",
    category: "Platform",
    surface: "active"
  }
];

const API_INVENTORY = {
  "geopolitics-dashboard": [],
  "middle-east-monitor": [
    { label: "Regional briefing", url: "/api/briefings/iran", kind: "internal" },
    { label: "Markets snapshot", url: "/api/markets", kind: "internal" },
    { label: "Ticker feed", url: "/api/ticker", kind: "internal" },
    { label: "Copernicus preview", url: "/api/copernicus/preview", kind: "internal" },
    { label: "GDACS event feed", url: "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH", kind: "external" },
    { label: "Open-Meteo forecast", url: "https://api.open-meteo.com/v1/forecast", kind: "external" }
  ],
  "smart-city-monitor": [
    { label: "Overview", url: "/api/overview", kind: "internal" },
    { label: "Pulse", url: "/api/pulse", kind: "internal" },
    { label: "Projects", url: "/api/projects", kind: "internal" },
    { label: "News", url: "/api/news", kind: "internal" },
    { label: "Map layers", url: "/api/map/layers", kind: "internal" },
    { label: "Map features", url: "/api/map/features", kind: "internal" },
    { label: "Resilience", url: "/api/resilience", kind: "internal" },
    { label: "Impact", url: "/api/impact", kind: "internal" },
    { label: "Markets", url: "/api/markets", kind: "internal" },
    { label: "Sources", url: "/api/sources", kind: "internal" },
    { label: "Activity", url: "/api/activity", kind: "internal" },
    { label: "Social listening", url: "/api/social-listening", kind: "internal" },
    { label: "Media feeds", url: "/api/media/feeds", kind: "internal" },
    { label: "Assistant status", url: "/api/assistant/status", kind: "internal" }
  ],
  "mtt-smart-city-monitor": [
    { label: "Overview", url: "/api/overview", kind: "internal" },
    { label: "Pulse", url: "/api/pulse", kind: "internal" },
    { label: "Projects", url: "/api/projects", kind: "internal" },
    { label: "News", url: "/api/news", kind: "internal" },
    { label: "Map layers", url: "/api/map/layers", kind: "internal" },
    { label: "Map features", url: "/api/map/features", kind: "internal" },
    { label: "Cities", url: "/api/cities", kind: "internal" },
    { label: "Domains", url: "/api/domains", kind: "internal" },
    { label: "Indicators", url: "/api/indicators", kind: "internal" },
    { label: "Resilience", url: "/api/resilience", kind: "internal" },
    { label: "Changes", url: "/api/changes", kind: "internal" },
    { label: "Activity", url: "/api/activity", kind: "internal" },
    { label: "Social listening", url: "/api/social-listening", kind: "internal" },
    { label: "Impact", url: "/api/impact", kind: "internal" },
    { label: "Markets", url: "/api/markets", kind: "internal" },
    { label: "Sources", url: "/api/sources", kind: "internal" },
    { label: "Latest briefing", url: "/api/briefings/latest", kind: "internal" },
    { label: "Media feeds", url: "/api/media/feeds", kind: "internal" },
    { label: "Media channels", url: "/api/media/channels", kind: "internal" },
    { label: "Assistant status", url: "/api/assistant/status", kind: "internal" },
    { label: "Assistant query", url: "/api/assistant/query", kind: "internal" }
  ],
  "phuket-smart-bus": [
    { label: "Health", url: "/api/health", kind: "internal" },
    { label: "Routes", url: "/api/routes", kind: "internal" },
    { label: "Route stops", url: "/api/routes/:routeId/stops", kind: "internal" },
    { label: "Service advisories", url: "/api/routes/:routeId/advisories", kind: "internal" },
    { label: "Leave-now summary", url: "/api/decision-summary?routeId=:routeId&stopId=:stopId", kind: "internal" }
  ],
  "city-reporter-bot": [
    { label: "Reports", url: "/api/reports", kind: "internal" },
    { label: "Report GeoJSON", url: "/api/reports/geojson", kind: "internal" },
    { label: "Early warnings", url: "/api/early-warnings", kind: "internal" },
    { label: "Upload", url: "/api/upload", kind: "internal" },
    { label: "Social analytics", url: "/api/analytics/social", kind: "internal" },
    { label: "Latest intelligence", url: "/api/intelligence/latest", kind: "internal" },
    { label: "Generate intelligence", url: "/api/intelligence/generate", kind: "internal" },
    { label: "News", url: "/api/news", kind: "internal" },
    { label: "Open-Meteo forecast", url: "https://api.open-meteo.com/v1/forecast", kind: "external" },
    { label: "Bangkok open data", url: "https://data.bangkok.go.th/api/3/action/datastore_search", kind: "external" }
  ],
  "tech-monitor": [
    { label: "NASA EONET", url: "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30", kind: "external" },
    { label: "ReliefWeb disasters", url: "https://api.reliefweb.int/v1/disasters?appname=techmonitor", kind: "external" },
    { label: "Open-Meteo forecast", url: "https://api.open-meteo.com/v1/forecast", kind: "external" },
    { label: "Open-Meteo air quality", url: "https://air-quality-api.open-meteo.com/v1/air-quality", kind: "external" },
    { label: "FX rates", url: "https://open.er-api.com/v6/latest/USD", kind: "external" },
    { label: "Binance ticker", url: "https://api.binance.com/api/v3/ticker/24hr", kind: "external" }
  ],
  "city-tech-atlas": [],
  "airdnd-platform": [
    { label: "Broadcast feed", url: "/api/broadcast", kind: "internal" },
    { label: "Supabase backend", url: "https://fehdtfncbutesgadjsxp.supabase.co", kind: "external" },
    { label: "Open-Meteo air quality", url: "https://air-quality-api.open-meteo.com/v1/air-quality", kind: "external" }
  ],
  "scl-landing-page": [],
  raat: [],
  "techhuntthailand-viabus": []
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
    const file = await readFile(SNAPSHOT_FILE);
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8"
    });
    response.end(file);
  } catch (error) {
    sendJson(response, 503, {
      error: "Snapshot file unavailable",
      status: "error"
    });
  }
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

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
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

    recordHistory(target.id, {
      at: checkedAt,
      health: health.code,
      ok: response.ok,
      responseTimeMs,
      statusCode: response.status
    });

    return {
      apis: buildApiInventory(target, finalUrl),
      category: target.category,
      checkedAt,
      description: target.description,
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
      surface: target.surface,
      url: target.url
    };
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

    return {
      apis: buildApiInventory(target, target.url),
      category: target.category,
      checkedAt,
      description: target.description,
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
      surface: target.surface,
      url: target.url
    };
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
    const [targets, github] = await Promise.all([
      Promise.all(TARGETS.map((target) => checkTarget(target))),
      getGitHubSnapshot()
    ]);

    const payload = {
      generatedAt: new Date().toISOString(),
      github,
      summary: buildSummary(targets, github),
      targets
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
    sendJson(response, 200, {
      service: "non-operations-radar",
      status: "ok",
      time: new Date().toISOString()
    });
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

  await serveStatic(url.pathname, response);
});

export { getDashboardData, hydrateHistoryFromSnapshot, server };

if (process.env.NO_LISTEN !== "1") {
  server.listen(PORT, HOST, () => {
    console.log(`Operations radar listening on http://${HOST}:${PORT}`);
  });
}
