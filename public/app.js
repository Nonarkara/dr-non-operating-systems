const LOCAL_STORAGE_KEY = "operations-radar-local-targets";
const SNAPSHOT_PATH = "./data/dashboard-snapshot.json";
const MANUAL_SCAN_WORKFLOW_URL =
  "https://github.com/Nonarkara/dr-non-operating-systems/actions/workflows/update-dashboard-snapshot.yml";
const MODE_PARAM = new URLSearchParams(window.location.search).get("mode");
const PREVIEW_VIEWPORT = {
  width: 1600,
  height: 900
};

const LAB_LOGOS = [
  {
    id: "smart-city-thailand-office",
    label: "Smart City Thailand Office",
    src: "./Logos/Smart City Thailand Office Logo.jpg"
  },
  {
    id: "depa",
    label: "Digital Economy Promotion Agency",
    src: "./Logos/Digital Economy Promotion Agency logo.jpg"
  },
  {
    id: "mdes",
    label: "Ministry of Digital Economy and Society",
    src: "./Logos/Ministry of Digital Economy and Society logo.jpg"
  },
  {
    id: "slic",
    label: "SLIC",
    src: "./Logos/SLIC logo.jpg"
  },
  {
    id: "axiom-ai",
    label: "AXIOM AI",
    src: "./Logos/AXIOM AI logo.png"
  },
  {
    id: "casean",
    label: "CASEAN",
    src: "./media/logos/casean.png"
  },
  {
    id: "pmu-a",
    label: "PMU-A",
    src: "./media/logos/pmu-a.jpeg"
  },
  {
    id: "depa-mark",
    label: "depa",
    src: "./media/logos/depa.png"
  },
  {
    id: "smart-city-thailand",
    label: "Smart City Thailand",
    src: "./media/logos/smart-city-thailand.jpg"
  },
  {
    id: "slic-thailand",
    label: "SLIC Thailand",
    src: "./media/logos/slicthailand.jpg"
  }
];

const ARCHIVE_IMAGES = [
  "1773377092111.jpg",
  "1773570166448.jpg",
  "1773570182857.jpg",
  "1773570231976.jpg",
  "1773570244976.jpg",
  "Screenshot 2569-02-04 at 00.06.38.png",
  "Screenshot 2569-02-04 at 00.25.43.png",
  "Screenshot 2569-03-10 at 16.12.05.png",
  "Screenshot 2569-03-10 at 16.15.00.png",
  "Screenshot 2569-03-10 at 16.16.22.png",
  "WhatsApp Image 2025-11-23 at 12.07.37 PM.jpeg"
];


const PROFILE = {
  byline: "City systems strategist, anthropologist, writer, and builder.",
  summary:
    "Dr. Non Arkaraprasertkul designs and delivers city systems under real pressure. The work combines anthropology, policy architecture, implementation strategy, and AI-assisted software production into one operating practice.",
  mission:
    "This wall now serves as both live operations dashboard and operating profile: apps, deployments, publications, credentials, and a current resume in one place.",
  credentials: [
    "Harvard PhD",
    "Oxford MPhil",
    "MIT SMArchS",
    "KMITL B.Arch (First Class Honors)"
  ],
  roles: [
    "Smart City Thailand Laboratory",
    "Innovation as a Service",
    "Research-to-Operations Delivery"
  ],
  metrics: [
    { label: "Projects", value: "120+" },
    { label: "Thai provinces", value: "77" },
    { label: "Officials trained", value: "5,000+" },
    { label: "Global forums", value: "100+" }
  ],
  links: [
    {
      label: "ResearchGate",
      meta: "Publication profile",
      url: "https://www.researchgate.net/profile/Non-Arkaraprasertkul"
    },
    {
      label: "Academia.edu",
      meta: "Academic archive",
      url: "https://independent.academia.edu/NonArkaraprasertkul"
    },
    {
      label: "Social Psychology Network",
      meta: "Professional listing",
      url: "https://arkaraprasertkul.socialpsychology.org/"
    },
    {
      label: "Substack",
      meta: "Essays and serialized writing",
      url: "https://nonarkara.substack.com/"
    },
    {
      label: "nonharvard",
      meta: "Writing archive",
      url: "https://nonharvard.wordpress.com/"
    },
    {
      label: "Primary contact",
      meta: "non.ar@depa.or.th",
      url: "mailto:non.ar@depa.or.th"
    },
    {
      label: "Academic contact",
      meta: "non@alum.mit.edu",
      url: "mailto:non@alum.mit.edu"
    }
  ],
  documents: [
    {
      label: "Non Resume 3-Page",
      meta: "March 2026 PDF",
      url: "./public/Non Resume 3-Page (March 2026).docx.pdf"
    }
  ],
  publications: [
    {
      title: "Gentrification and Its Contentment",
      meta: "Urban Studies, 2018",
      url: "https://doi.org/10.1177/0042098016684313"
    },
    {
      title: "Gentrifying Heritage",
      meta: "International Journal of Heritage Studies, 2018",
      url: "https://doi.org/10.1080/13527258.2018.1460732"
    },
    {
      title: "Mobility in a Global City",
      meta: "Urban Studies, 2017",
      url: "https://doi.org/10.1177/0042098016637568"
    },
    {
      title: "The Social Poetics of Urban Design",
      meta: "Journal of Urban Design, 2016",
      url: "https://doi.org/10.1080/13574809.2016.1184564"
    },
    {
      title: "Toward Modernist Urban Design",
      meta: "Journal of Urban Design, 2008",
      url: "https://doi.org/10.1080/13574800801965676"
    },
    {
      title: "Infrastructural Urbanism in the Age of Climate Change",
      meta: "ResearchGate archive, 2019",
      url: "https://www.researchgate.net/publication/333502312_Infrastructural_Urbanism_in_the_Age_of_Climate_Change_The_Return_of_the_Social_Engineer"
    }
  ],
  footer: {
    system:
      "Authored by Dr. Non and assembled through AI-assisted production with final editorial control retained by Dr. Non.",
    lab:
      "Part of the Smart City Thailand Laboratory: innovation is treated here as deployable public infrastructure.",
    privacy:
      "Public mode monitors listed services; local targets stay browser-local and appear only in live mode.",
    copyright:
      "Copyright notice: Unless otherwise stated, original interface composition, written copy, curation, and locally hosted profile materials on this page are copyright Dr. Non and the Smart City Thailand Laboratory. Open-source stance: the preference is to collaborate, share, and give useful code away where practical. If you would like access to code, reuse permission, or a joint build, please make contact."
  }
};

const NOVEL_DATA = {
  title: "Designated Survivor: Bangkok",
  tagline: "When the system collapses, build a new one.",
  summary: "A speculative thriller set in 2026. Protagonist Dr. Non discovers a breach in a dormant emergency system via his smart glasses, signaling the beginning of a systemic collapse that only he can decode.",
  url: "https://substack.com/@nonarkara?utm_source=top-search",
  coverImage: "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7868b669-5217-4207-a393-43d582fc3628_2528x1696.png",
  chapters: ["Chapter 1: Champagne Supernova", "Chapter 2: Protocols in the Mist", "Chapter 3: The Bangkok Perimeter"]
};

const BRANDS = {
  "airdnd-platform": {
    monogram: "AD"
  },
  "asean-csco-app": {
    monogram: "AC"
  },
  "ascn-smart-cities-network": {
    monogram: "AS"
  },
  "city-reporter-bot": {
    monogram: "CR"
  },
  "city-reporter-bot-v2": {
    monogram: "CR"
  },
  "city-tech-atlas": {
    monogram: "CA"
  },
  "middle-east-monitor": {
    monogram: "ME"
  },
  "mtt-smart-city-monitor": {
    monogram: "MT"
  },
  "phuket-smart-bus": {
    monogram: "PB"
  },
  "phuket-dashboard": {
    monogram: "PD"
  },
  raat: {
    monogram: "RA"
  },
  "scl-landing-page": {
    monogram: "SL"
  },
  "slic-index-rankings": {
    monogram: "SI"
  },
  "slic-index-v2": {
    monogram: "SI"
  },
  "smart-city-monitor": {
    monogram: "SC"
  },
  "tech-monitor": {
    monogram: "TM"
  },
  "techhuntthailand-viabus": {
    monogram: "TH"
  }
};

const STARTER_BLUEPRINTS = {
  default: {
    appClass: "web-system",
    stack: {
      frontend: "HTML/CSS/JavaScript",
      backend: "Optional Node service",
      deploy: "GitHub Pages or Render"
    },
    modules: ["hero", "content grid", "status strip", "resource links"],
    notes: "Replace branding, data sources, and contact information."
  },
  "scl-landing-page": {
    appClass: "strategic-landing-page",
    stack: {
      frontend: "Static HTML/CSS/JavaScript",
      backend: "None required",
      deploy: "GitHub Pages"
    },
    modules: ["hero narrative", "program overview", "partner logos", "call-to-action"],
    notes: "Use for public campaigns, launch pages, and institutional storytelling."
  },
  "ascn-smart-cities-network": {
    appClass: "network-knowledge-site",
    stack: {
      frontend: "Static HTML/CSS/JavaScript",
      backend: "None required",
      deploy: "GitHub Pages"
    },
    modules: ["regional network overview", "member city sections", "resource links", "narrative landing blocks"],
    notes: "Use for coalition, regional network, or institutional alliance websites."
  },
  "middle-east-monitor": {
    appClass: "regional-operations-monitor",
    stack: {
      frontend: "Vite or static SPA",
      backend: "Node API proxy",
      deploy: "Render"
    },
    modules: ["live map", "regional briefings", "source panels", "market radar", "status ticker"],
    notes: "Designed for high-density geopolitical monitoring with live external feeds."
  },
  "city-reporter-bot": {
    appClass: "reporting-bot-console",
    stack: {
      frontend: "Node or Vite dashboard",
      backend: "Node service",
      deploy: "Render"
    },
    modules: ["report intake", "uploads", "GeoJSON export", "early warnings", "intelligence generation"],
    notes: "Use for citizen reporting, bot-assisted workflows, and field intelligence."
  },
  "city-reporter-bot-v2": {
    appClass: "reporting-bot-console",
    stack: {
      frontend: "Node or Vite dashboard",
      backend: "Node service",
      deploy: "Render"
    },
    modules: ["report intake", "uploads", "GeoJSON export", "early warnings", "intelligence generation"],
    notes: "Use for citizen reporting, bot-assisted workflows, and field intelligence."
  },
  "smart-city-monitor": {
    appClass: "geospatial-city-monitor",
    stack: {
      frontend: "Map-driven SPA",
      backend: "Node API",
      deploy: "Render"
    },
    modules: ["layered map", "overview KPIs", "news feed", "projects", "resilience and pollution lenses"],
    notes: "Built for smart city analytics with map layers and operational data cards."
  },
  "mtt-smart-city-monitor": {
    appClass: "campus-smart-city-operations-console",
    stack: {
      frontend: "React or Vite SPA",
      backend: "Node API",
      deploy: "Render"
    },
    modules: ["super dashboard", "domain and city views", "map layers", "media intelligence", "assistant tools"],
    notes: "Use for district-scale or campus-scale smart city monitoring with multiple operational lenses and admin tooling."
  },
  "phuket-smart-bus": {
    appClass: "transit-rider-prototype",
    stack: {
      frontend: "React or Vite SPA",
      backend: "Node API",
      deploy: "Render"
    },
    modules: ["route selector", "stop list", "service advisories", "leave-now guidance", "health endpoint"],
    notes: "Use for rider-facing transit apps with route-specific guidance and operational advisories."
  },
  "phuket-dashboard": {
    appClass: "regional-operations-monitor",
    stack: {
      frontend: "Vite or static SPA",
      backend: "Node API proxy",
      deploy: "Render"
    },
    modules: ["live map", "regional briefings", "source panels", "market radar", "status ticker"],
    notes: "Coastal operations dashboard for Phuket and surrounding provinces."
  },
  raat: {
    appClass: "multilingual-institutional-site",
    stack: {
      frontend: "Static multilingual site",
      backend: "None required",
      deploy: "GitHub Pages"
    },
    modules: ["language switcher", "content sections", "public information pages"],
    notes: "Use for institutional sites that need multilingual public delivery."
  },
  "tech-monitor": {
    appClass: "technology-and-risk-monitor",
    stack: {
      frontend: "Static SPA",
      backend: "Feed aggregation API",
      deploy: "Render"
    },
    modules: ["signal dashboard", "external feeds", "market data", "incident watch"],
    notes: "Use for thematic monitoring across technology, markets, and disaster signals."
  },
  "city-tech-atlas": {
    appClass: "solution-atlas",
    stack: {
      frontend: "SPA directory UI",
      backend: "Optional search/data service",
      deploy: "Lovable or static host"
    },
    modules: ["searchable atlas", "solution cards", "filters", "detail pages"],
    notes: "Use for ecosystems, vendor landscapes, or policy technology directories."
  },
  "slic-index-v2": {
    appClass: "narrative-city-index",
    stack: {
      frontend: "React or Vite SPA",
      backend: "Optional data/analytics service",
      deploy: "Render"
    },
    modules: ["landing narrative", "rankings view", "methodology page", "city match exercise", "country spotlight"],
    notes: "Use for index or benchmark experiences that combine storytelling, rankings, and guided exploration."
  },
  "techhuntthailand-viabus": {
    appClass: "case-study-directory-page",
    stack: {
      frontend: "Static HTML/CSS/JavaScript",
      backend: "None required",
      deploy: "GitHub Pages"
    },
    modules: ["solution profile", "taxonomy tags", "partner information", "navigation back to index"],
    notes: "Use for startup or solution scouting catalogs with individual detail pages."
  },
  "airdnd-platform": {
    appClass: "platform-service",
    stack: {
      frontend: "Web app",
      backend: "API + database backend",
      deploy: "Render"
    },
    modules: ["broadcast feed", "user-facing platform pages", "data backend integration"],
    notes: "Use for productized platforms with a public frontend and live backend services."
  }
};

function isLocalLikeHost(hostname) {
  if (!hostname) {
    return false;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.endsWith(".local")) {
    return true;
  }

  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) {
    return true;
  }

  const match = hostname.match(/^172\.(\d{1,2})\./);

  if (!match) {
    return false;
  }

  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}

function resolveDataMode() {
  if (MODE_PARAM === "live") {
    return "live";
  }

  if (MODE_PARAM === "snapshot") {
    return "snapshot";
  }

  return isLocalLikeHost(window.location.hostname) ? "live" : "snapshot";
}

const DATA_MODE = resolveDataMode();

const state = {
  autoRefreshMs: DATA_MODE === "live" ? 30_000 : 0,
  dashboard: null,
  lastLoadSource: null,
  localPreviewHistory: new Map(),
  localTargets: loadLocalTargets(),
  mentions: null,
  mode: DATA_MODE,
  refreshTimer: null
};

let previewFrameSyncHandle = 0;
const previewLoadTokens = new WeakMap();

const elements = {
  activeGrid: document.querySelector("#activeGrid"),
  apiGrid: document.querySelector("#apiGrid"),
  apiSummary: document.querySelector("#apiSummary"),
  brandStrip: document.querySelector("#brandStrip"),
  clock: document.querySelector("#clock"),
  copyrightNote: document.querySelector("#copyrightNote"),
  dashboardState: document.querySelector("#dashboardState"),
  footerTerminal: document.querySelector("#footerTerminal"),
  featuredGrid: document.querySelector("#featuredGrid"),
  githubPanel: document.querySelector("#githubPanel"),
  githubSummary: document.querySelector("#githubSummary"),
  issueList: document.querySelector("#issueList"),
  issuePanel: document.querySelector("#issuePanel"),
  labLogoStrip: document.querySelector("#labLogoStrip"),
  lastChecked: document.querySelector("#lastChecked"),
  localForm: document.querySelector("#localForm"),
  localGrid: document.querySelector("#localGrid"),
  localLayout: document.querySelector("#localLayout"),
  metricsGrid: document.querySelector("#metricsGrid"),
  manualScanLink: document.querySelector("#manualScanLink"),
  mentionsList: document.querySelector("#mentionsList"),
  mentionsMeta: document.querySelector("#mentionsMeta"),
  mentionsPanel: document.querySelector("#mentionsPanel"),
  mentionsRefreshButton: document.querySelector("#mentionsRefreshButton"),
  mentionsSearchLink: document.querySelector("#mentionsSearchLink"),
  mentionsStatus: document.querySelector("#mentionsStatus"),
  modeNote: document.querySelector("#modeNote"),
  openAllButton: document.querySelector("#openAllButton"),
  opsInventory: document.querySelector("#ops-inventory"),
  profileCredentialTags: document.querySelector("#profileCredentialTags"),
  profileDocs: document.querySelector("#profileDocs"),
  profileLinks: document.querySelector("#profileLinks"),
  profileMetricStrip: document.querySelector("#profileMetricStrip"),
  profilePublications: document.querySelector("#profilePublications"),
  profileSummary: document.querySelector("#profileSummary"),
  refreshButton: document.querySelector("#refreshButton"),
  refreshSelect: document.querySelector("#refreshSelect"),
  signalGrid: document.querySelector("#signalGrid"),
  staticGrid: document.querySelector("#staticGrid"),
  recentProjectsList: document.querySelector("#recentProjectsList"),
  publishingGraph: document.querySelector("#publishingGraph"),
  historyGallery: document.querySelector("#historyGallery"),
  copyBlueprintButton: document.querySelector("#copyBlueprintButton"),
  blueprintCode: document.querySelector("#blueprintCode")
};



function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "n/a";
  }

  return `${new Intl.NumberFormat().format(value)}${suffix}`;
}

function formatDate(value) {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function shortTime(value) {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatRelativeTime(value) {
  if (!value) {
    return "n/a";
  }

  const deltaMs = new Date(value).getTime() - Date.now();

  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
    Math.round(deltaMs / (24 * 60 * 60 * 1000)),
    "day"
  );
}

function makeStatusPill(label, code) {
  return `<span class="status-pill status-pill-${escapeHtml(code || "neutral")}">${escapeHtml(label)}</span>`;
}

function mentionStatusView(mentions) {
  if (!mentions) {
    return {
      code: "loading",
      label: "Awaiting sweep"
    };
  }

  if (mentions.status === "live") {
    return {
      code: "live",
      label: "Live sweep"
    };
  }

  if (mentions.status === "degraded") {
    return {
      code: "degraded",
      label: "Partial sweep"
    };
  }

  if (mentions.status === "offline") {
    return {
      code: "error",
      label: "Sweep offline"
    };
  }

  return {
    code: "neutral",
    label: "No current hits"
  };
}

function getBranding(target) {
  return BRANDS[target.id] ?? {
    monogram: target.label
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase()
  };
}

function loadLocalTargets() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveLocalTargets() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.localTargets));
}

function getSnapshotUrl(force = false) {
  return force ? `${SNAPSHOT_PATH}?t=${Date.now()}` : SNAPSHOT_PATH;
}

function applyModeUI() {
  const liveMode = state.mode === "live";
  const fallbackMode = state.lastLoadSource === "snapshot-fallback";

  elements.refreshButton.textContent = liveMode ? "Run live scan" : "Reload snapshot";
  elements.manualScanLink.href = MANUAL_SCAN_WORKFLOW_URL;
  elements.manualScanLink.textContent = liveMode ? "Open snapshot workflow" : "Run manual scan";
  elements.refreshSelect.disabled = !liveMode;
  elements.refreshSelect.value = String(state.autoRefreshMs);

  let note = liveMode
    ? "Local live mode scans all targets from this machine. Auto refresh is local-only."
    : "Snapshot mode is active on the public web. A fresh server scan only happens when you run the GitHub workflow.";

  if (fallbackMode) {
    note = "Live API unavailable on this machine, so the page is showing the last committed snapshot instead.";
  }

  elements.modeNote.textContent = note;
  elements.opsInventory.hidden = !liveMode;
  elements.localLayout.hidden = !liveMode;
}

function updateClock() {
  elements.clock.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function startClock() {
  updateClock();
  window.setInterval(updateClock, 1_000);
}

function scheduleRefresh() {
  if (state.refreshTimer) {
    window.clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }

  if (state.autoRefreshMs > 0) {
    state.refreshTimer = window.setInterval(() => {
      refreshDashboard();
      renderLocalTargets();
    }, state.autoRefreshMs);
  }
}

function recordPreviewHistory(map, id, code) {
  const history = map.get(id) || [];
  history.push({
    at: new Date().toISOString(),
    health: code
  });

  while (history.length > 36) {
    history.shift();
  }

  map.set(id, history);
}

function renderHistory(history = []) {
  return history
    .slice(-36)
    .map((point) => {
      const height = point.health === "live" ? 100 : point.health === "slow" ? 68 : 34;
      return `<span data-health="${escapeHtml(point.health)}" style="height:${height}%"></span>`;
    })
    .join("");
}

function renderMetrics(summary, github) {
  const metrics = [
    {
      label: "Public pages",
      value: formatNumber(summary.monitoredPages),
      subtext: "Everything currently monitored on the wall"
    },
    {
      label: "Active apps",
      value: formatNumber(summary.activeCount),
      subtext: `${formatNumber(summary.staticCount)} static pages beside them`
    },
    {
      label: "Healthy now",
      value: formatNumber(summary.liveCount),
      subtext: `${formatNumber(summary.attentionCount)} items need attention`
    },
    {
      label: "Mapped APIs",
      value: formatNumber(summary.apiCount),
      subtext: `${formatNumber(summary.appsWithApis)} apps with runtime endpoints`
    },
    {
      label: "Median response",
      value: formatNumber(summary.medianResponseMs, " ms"),
      subtext: summary.fastest
        ? `Fastest: ${summary.fastest.label} at ${summary.fastest.responseTimeMs} ms`
        : "No successful responses yet"
    },
    {
      label: "Platforms",
      value: formatNumber(summary.platformsInUse),
      subtext: summary.platformBreakdown.map((item) => `${item.platform} ${item.count}`).join(" • ")
    },
    {
      label: "GitHub public repos",
      value: formatNumber(summary.publicRepos),
      subtext: github.stats.githubPagesRepos !== null
        ? `${github.stats.githubPagesRepos} repos with Pages enabled`
        : "GitHub metadata unavailable"
    }
  ];

  elements.metricsGrid.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <p class="metric-label">${escapeHtml(metric.label)}</p>
          <div class="metric-value">${escapeHtml(metric.value)}</div>
          <div class="metric-subtext">${escapeHtml(metric.subtext)}</div>
        </article>
      `
    )
    .join("");
}

function renderBrandStrip(targets) {
  elements.brandStrip.innerHTML = targets
    .map((target) => {
      const branding = getBranding(target);
      const surfaceLabel = target.surface === "active" ? "Active app" : "Static page";

      return `
        <a class="surface-chip" href="${escapeHtml(target.url)}" rel="noreferrer" target="_blank" data-health="${escapeHtml(target.health.code)}" data-target-id="${escapeHtml(target.id)}">
          <div class="surface-main">
            <span class="surface-monogram">${escapeHtml(branding.monogram)}</span>
            <span class="surface-copy">
              <strong>${escapeHtml(target.label)}</strong>
              <span>${escapeHtml(target.platform)} • ${escapeHtml(surfaceLabel)}</span>
            </span>
          </div>
          <span class="surface-tail">${escapeHtml(target.health.label)}</span>
        </a>
      `;
    })
    .join("");
}

function renderLabLogos() {
  elements.labLogoStrip.innerHTML = LAB_LOGOS.map(
    (logo) => `
      <article class="logo-chip" data-logo-id="${escapeHtml(logo.id || "")}">
        <div class="logo-mark">
          <img class="logo-image" alt="${escapeHtml(logo.label)} logo" loading="lazy" src="${escapeHtml(logo.src)}" />
        </div>
        <span>${escapeHtml(logo.label)}</span>
      </article>
    `
  ).join("");

  for (const chip of elements.labLogoStrip.querySelectorAll(".logo-chip")) {
    const image = chip.querySelector(".logo-image");

    if (!image) {
      continue;
    }

    image.addEventListener(
      "error",
      () => {
        chip.classList.add("logo-chip-fallback");
      },
      { once: true }
    );
  }
}

function linkAttributes(url) {
  return /^https?:\/\//i.test(url) ? 'target="_blank" rel="noreferrer"' : "";
}

function renderProfile(summary) {
  elements.profileSummary.innerHTML = `
    <p class="profile-byline">${escapeHtml(PROFILE.byline)}</p>
    <p class="profile-copy">${escapeHtml(PROFILE.summary)}</p>
    <p class="profile-copy">${escapeHtml(PROFILE.mission)}</p>
    <div class="tag-cluster">
      ${PROFILE.roles.map((role) => `<span class="tag">${escapeHtml(role)}</span>`).join("")}
      <span class="tag">Monitored properties ${escapeHtml(formatNumber(summary.monitoredPages))}</span>
    </div>
  `;

  elements.profileCredentialTags.innerHTML = PROFILE.credentials
    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
    .join("");

  elements.profileMetricStrip.innerHTML = PROFILE.metrics
    .map(
      (metric) => `
        <article class="profile-stat">
          <span class="profile-stat-value">${escapeHtml(metric.value)}</span>
          <span class="profile-stat-label">${escapeHtml(metric.label)}</span>
        </article>
      `
    )
    .join("");

  elements.profileLinks.innerHTML = PROFILE.links
    .map(
      (item) => `
        <a class="document-row" href="${escapeHtml(item.url)}" ${linkAttributes(item.url)}>
          <span>
            <strong>${escapeHtml(item.label)}</strong>
            <small>${escapeHtml(item.meta)}</small>
          </span>
          <code>${/^mailto:/i.test(item.url) ? "contact" : "open"}</code>
        </a>
      `
    )
    .join("");

  elements.profileDocs.innerHTML = PROFILE.documents
    .map(
      (item) => `
        <a class="document-row" href="${escapeHtml(item.url)}" ${linkAttributes(item.url)}>
          <span>
            <strong>${escapeHtml(item.label)}</strong>
            <small>${escapeHtml(item.meta)}</small>
          </span>
          <code>pdf</code>
        </a>
      `
    )
    .join("");

  elements.profilePublications.innerHTML = PROFILE.publications
    .map(
      (item, index) => `
        <a class="publication-row" href="${escapeHtml(item.url)}" ${linkAttributes(item.url)}>
          <span class="publication-index">${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
          <span class="publication-main">
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.meta)}</small>
          </span>
          <code>open</code>
        </a>
      `
    )
    .join("");
}

function renderFooter() {
  elements.footerTerminal.innerHTML = `
    <p class="terminal-line">${escapeHtml(PROFILE.footer.system)}</p>
    <p class="terminal-line">${escapeHtml(PROFILE.footer.lab)}</p>
    <p class="terminal-line">${escapeHtml(PROFILE.footer.privacy)}</p>
  `;
  elements.copyrightNote.textContent = `${PROFILE.footer.copyright} ${new Date().getFullYear()}.`;
}

function renderMentions(mentions = state.mentions) {
  const snapshotBacked = state.lastLoadSource === "snapshot" || state.lastLoadSource === "snapshot-fallback";
  const statusView = mentionStatusView(mentions);
  const meta = [];

  elements.mentionsStatus.innerHTML = makeStatusPill(statusView.label, statusView.code);

  if (mentions?.latestAt) {
    meta.push(`Latest indexed hit ${formatDate(mentions.latestAt)}`);
  } else if (mentions?.status === "offline") {
    meta.push("Mention sweep is currently unavailable.");
  } else {
    meta.push("Scanning for the most recent indexed mention across the configured names.");
  }

  if (mentions?.checkedAt) {
    meta.push(`${snapshotBacked ? "Snapshot checked" : "Checked"} ${formatDate(mentions.checkedAt)}`);
  }

  meta.push("4 name variants");
  meta.push("English + Thai search sweep");

  if (snapshotBacked) {
    meta.push("Snapshot-backed");
  }

  if (mentions?.error && !mentions?.items?.length) {
    meta.push(mentions.error);
  }

  elements.mentionsMeta.textContent = meta.join(" • ");
  elements.mentionsSearchLink.href = mentions?.searchUrl || "https://news.google.com/";
  elements.mentionsSearchLink.hidden = !mentions?.searchUrl;

  if (!mentions) {
    elements.mentionsList.innerHTML = `<div class="empty-state">Loading mention sweep.</div>`;
    return;
  }

  if (!mentions.items?.length) {
    elements.mentionsList.innerHTML = `
      <div class="empty-state">
        ${escapeHtml(
          mentions.error
            ? `No mention cards are available right now. ${mentions.error}`
            : "No indexed mentions were found yet for the configured names."
        )}
      </div>
    `;
    return;
  }

  elements.mentionsList.innerHTML = mentions.items
    .map(
      (item, index) => `
        <a class="mention-row" href="${escapeHtml(item.link)}" rel="noreferrer" target="_blank">
          <span class="mention-index">${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
          <span class="mention-main">
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.source)} • ${escapeHtml(formatDate(item.publishedAt))} • ${escapeHtml(item.feed)}</small>
          </span>
          <code>${escapeHtml(formatRelativeTime(item.publishedAt))}</code>
        </a>
      `
    )
    .join("");
}

function renderGitHub(github) {
  if (github.status !== "live" || !github.profile) {
    elements.githubPanel.hidden = false;
    elements.githubSummary.innerHTML = `
      <div class="github-strip">
        ${makeStatusPill("GitHub unavailable", "error")}
        <span class="terminal-inline">${escapeHtml(github.error || "Metadata could not be loaded.")}</span>
      </div>
    `;
    return;
  }

  elements.githubSummary.innerHTML = `
    <div class="github-strip">
      ${makeStatusPill(github.profile.login, "live")}
      <span class="terminal-inline">${escapeHtml(formatNumber(github.profile.publicRepos))} public repos</span>
      <span class="terminal-inline">${escapeHtml(formatNumber(github.stats.githubPagesRepos))} Pages-enabled</span>
      <span class="terminal-inline">${escapeHtml(formatNumber(github.stats.activeLast30d))} active in 30d</span>
      <span class="terminal-inline">Updated ${escapeHtml(formatDate(github.profile.updatedAt))}</span>
      <a class="action-link" href="${escapeHtml(github.profile.url)}" rel="noreferrer" target="_blank">Open GitHub</a>
    </div>
  `;
}

function renderIssues(summary) {
  if (!summary.issues.length) {
    elements.issuePanel.hidden = true;
    elements.signalGrid.hidden = elements.githubPanel.hidden;
    return;
  }

  elements.issuePanel.hidden = false;
  elements.signalGrid.hidden = false;
  elements.issueList.innerHTML = summary.issues
    .map(
      (issue) => `
        <article class="issue-item">
          <strong>${escapeHtml(issue.label)}</strong>
          <div>${escapeHtml(issue.reason)}</div>
        </article>
      `
    )
    .join("");
}

function renderApiInventory(targets, summary) {
  const apiTargets = targets.filter((target) => target.apis.length > 0);

  elements.apiSummary.textContent = `${formatNumber(summary.apiCount)} mapped endpoints across ${formatNumber(summary.appsWithApis)} apps. Internal routes are resolved against each deployment origin.`;

  if (!apiTargets.length) {
    elements.apiGrid.innerHTML = `<div class="empty-state">No runtime APIs have been mapped yet.</div>`;
    return;
  }

  elements.apiGrid.innerHTML = apiTargets
    .map(
      (target) => `
        <article class="api-card">
          <div class="api-card-head">
            <div>
              <p class="eyebrow">${escapeHtml(target.surface === "active" ? "Active app" : "Static app")}</p>
              <h3>${escapeHtml(target.label)}</h3>
            </div>
            ${makeStatusPill(`${target.apis.length} APIs`, "neutral")}
          </div>
          <div class="tag-cluster">
            <span class="tag">${escapeHtml(target.platform)}</span>
            <span class="tag">${escapeHtml(target.category)}</span>
          </div>
          <div class="api-link-list">
            ${target.apis
              .map(
                (api) => `
                  <a class="api-link" href="${escapeHtml(api.url)}" rel="noreferrer" target="_blank">
                    <span>${escapeHtml(api.label)}</span>
                    <code>${escapeHtml(api.kind)}</code>
                  </a>
                `
              )
              .join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function buildStarterJson(target) {
  const blueprint = STARTER_BLUEPRINTS[target.id] ?? STARTER_BLUEPRINTS.default;

  return {
    schema: "dr-non-app-starter/v1",
    sourceApp: {
      id: target.id,
      name: target.label,
      category: target.category,
      surface: target.surface,
      platform: target.platform,
      referenceUrl: target.url
    },
    appClass: blueprint.appClass,
    goal: target.description,
    stack: blueprint.stack,
    modules: blueprint.modules,
    runtimeEndpoints: target.apis.map((api) => ({
      label: api.label,
      type: api.kind,
      url: api.url
    })),
    cloningChecklist: [
      "Duplicate the structure and replace branding.",
      "Swap data feeds and API keys.",
      "Adjust deployment settings for your own host.",
      "Rewrite copy and datasets for your geography or sector."
    ],
    notes: blueprint.notes
  };
}

function buildRemoteCard(target, options = {}) {
  const featured = options.featured === true;
  const classes = ["site-card"];
  const starterJson = JSON.stringify(buildStarterJson(target), null, 2);

  if (featured) {
    classes.push("site-card-featured");
  }

  if (target.surface === "static") {
    classes.push("site-card-static");
  }

  const metaRows = [
    ["Surface", target.surface === "active" ? "Active app" : "Static page"],
    ["Platform", target.platform],
    ["HTTP", target.statusCode ?? "n/a"],
    ["Response", target.responseTimeMs ? `${target.responseTimeMs} ms` : "n/a"],
    ["Last modified", formatDate(target.metadata.lastModified)],
    ["Server", target.metadata.server || target.metadata.xPoweredBy || "n/a"],
    ["Final host", target.hostname]
  ];

  if (target.repo?.fullName) {
    metaRows.push(["Repo", target.repo.fullName]);
    metaRows.push([
      "Repo Pages",
      target.repo.hasPages === true ? "Enabled" : target.repo.hasPages === false ? "Disabled" : "Unknown"
    ]);
  }

  return `
    <article class="${classes.join(" ")}" data-health="${escapeHtml(target.health.code)}" data-preview-id="${escapeHtml(target.id)}">
      <div class="card-top">
        <div class="card-title">
          <p class="eyebrow">${escapeHtml(target.category)}</p>
          <h3>${escapeHtml(target.label)}</h3>
          <p>${escapeHtml(target.metadata.title || target.description)}</p>
        </div>
        <div class="card-status">${makeStatusPill(target.health.label, target.health.code)}</div>
      </div>

      <div class="mini-grid">
        <div class="mini-stat">
          <span class="mini-label">Service</span>
          <span class="mini-value">${escapeHtml(target.health.reason)}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-label">Checked</span>
          <span class="mini-value">${escapeHtml(shortTime(target.checkedAt))}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-label">Platform</span>
          <span class="mini-value">${escapeHtml(target.platform)}</span>
        </div>
      </div>

      <div
        class="preview-shell"
        aria-label="Open ${escapeHtml(target.label)} live site"
        data-open-url="${escapeHtml(target.url)}"
        role="link"
        style="--preview-width: ${PREVIEW_VIEWPORT.width}; --preview-height: ${PREVIEW_VIEWPORT.height};"
        tabindex="0"
      >
        <div class="preview-bar">
          <div class="preview-signal">${makeStatusPill("Preview loading", "loading")}</div>
          <div class="preview-http">${makeStatusPill(target.statusCode ? `HTTP ${target.statusCode}` : "No HTTP code", target.health.code)}</div>
        </div>
        <iframe loading="lazy" referrerpolicy="no-referrer" src="${escapeHtml(target.url)}" title="${escapeHtml(target.label)} preview"></iframe>
        <div class="preview-fade"></div>
      </div>

      <div class="history">
        <p class="eyebrow">Recent server checks</p>
        <div class="history-bars">${renderHistory(target.history)}</div>
      </div>

      <details>
        <summary>Metadata</summary>
        <div class="meta-list">
          ${metaRows
            .map(
              ([key, value]) => `
                <div class="meta-row">
                  <span>${escapeHtml(key)}</span>
                  <code>${escapeHtml(value)}</code>
                </div>
              `
            )
            .join("")}
        </div>
      </details>

      <div class="card-actions">
        <button class="button button-secondary utility-button" data-refresh-preview="remote" type="button">
          Refresh page
        </button>
        <a class="action-link" href="${escapeHtml(target.url)}" rel="noreferrer" target="_blank">Open live</a>
        ${
          target.repo?.url
            ? `<a class="action-link" href="${escapeHtml(target.repo.url)}" rel="noreferrer" target="_blank">Open repo</a>`
            : ""
        }
      </div>

      <details class="starter-shell">
        <summary>Starter JSON</summary>
        <div class="starter-toolbar">
          <button class="button button-secondary starter-copy-button" data-copy-blueprint="${escapeHtml(target.id)}" type="button">
            Copy JSON
          </button>
          <span class="panel-note">Use this as a starting scaffold for a similar app.</span>
        </div>
        <pre class="starter-code"><code>${escapeHtml(starterJson)}</code></pre>
      </details>
    </article>
  `;
}

function buildLocalCard(target, index) {
  const history = state.localPreviewHistory.get(target.id) || [];

  return `
    <article class="site-card" data-health="neutral" data-preview-id="${escapeHtml(target.id)}">
      <div class="card-top">
        <div class="card-title">
          <p class="eyebrow">Local preview</p>
          <h3>${escapeHtml(target.label)}</h3>
          <p>${escapeHtml(target.url)}</p>
        </div>
        <div class="card-status">${makeStatusPill("Waiting", "neutral")}</div>
      </div>

      <div class="mini-grid">
        <div class="mini-stat">
          <span class="mini-label">Mode</span>
          <span class="mini-value">Browser signal only</span>
        </div>
        <div class="mini-stat">
          <span class="mini-label">Target</span>
          <span class="mini-value">${escapeHtml(new URL(target.url).host)}</span>
        </div>
      </div>

      <div
        class="preview-shell"
        aria-label="Open ${escapeHtml(target.label)} target"
        data-open-url="${escapeHtml(target.url)}"
        role="link"
        style="--preview-width: ${PREVIEW_VIEWPORT.width}; --preview-height: ${PREVIEW_VIEWPORT.height};"
        tabindex="0"
      >
        <div class="preview-bar">
          <div class="preview-signal">${makeStatusPill("Connecting", "loading")}</div>
          <div class="preview-http">${makeStatusPill("Local", "neutral")}</div>
        </div>
        <iframe loading="lazy" referrerpolicy="no-referrer" src="${escapeHtml(target.url)}" title="${escapeHtml(target.label)} preview"></iframe>
        <div class="preview-fade"></div>
      </div>

      <div class="history">
        <p class="eyebrow">Recent preview signals</p>
        <div class="history-bars">${renderHistory(history)}</div>
      </div>

      <div class="card-actions">
        <button class="button button-secondary utility-button" data-refresh-preview="local" type="button">
          Refresh page
        </button>
        <a class="action-link" href="${escapeHtml(target.url)}" rel="noreferrer" target="_blank">Open target</a>
        <button class="button remove-button" data-remove-index="${index}" type="button">Remove</button>
      </div>
    </article>
  `;
}

function renderSection(container, cards, emptyMessage) {
  container.innerHTML = cards.length ? cards.join("") : `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
}

function openPreview(event) {
  const shell = event.target.closest(".preview-shell[data-open-url]");

  if (!shell) {
    return;
  }

  const url = shell.dataset.openUrl;

  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function handlePreviewKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const shell = event.target.closest(".preview-shell[data-open-url]");

  if (!shell) {
    return;
  }

  event.preventDefault();
  openPreview(event);
}

function syncPreviewFrames() {
  for (const shell of document.querySelectorAll(".preview-shell")) {
    const previewWidth = Number(shell.style.getPropertyValue("--preview-width")) || PREVIEW_VIEWPORT.width;
    const shellWidth = shell.clientWidth;

    if (!shellWidth) {
      continue;
    }

    const scale = Math.min(1, shellWidth / previewWidth);
    shell.style.setProperty("--preview-scale", scale.toFixed(4));
  }
}

function requestPreviewFrameSync() {
  if (previewFrameSyncHandle) {
    return;
  }

  previewFrameSyncHandle = window.requestAnimationFrame(() => {
    previewFrameSyncHandle = 0;
    syncPreviewFrames();
  });
}

function startPreviewSignal(card, isLocal, options = {}) {
  const previewId = card.dataset.previewId;
  const signalSlot = card.querySelector(".preview-signal");
  const statusSlot = card.querySelector(".card-status");
  const iframe = card.querySelector("iframe");
  const historyBars = isLocal ? card.querySelector(".history-bars") : null;

  if (!previewId || !signalSlot || !iframe) {
    return;
  }

  const token = crypto.randomUUID();
  const timeoutMs = 12_000;
  const initialLabel = options.reload ? "Refreshing preview" : isLocal ? "Connecting" : "Preview loading";
  let historyRecorded = false;
  let slowMark = false;
  previewLoadTokens.set(card, token);

  signalSlot.innerHTML = makeStatusPill(initialLabel, "loading");

  if (isLocal && statusSlot) {
    statusSlot.innerHTML = makeStatusPill(options.reload ? "Refreshing" : "Connecting", "loading");
    card.dataset.health = "loading";
  }

  const pushHistory = (code) => {
    if (!isLocal || historyRecorded) {
      return;
    }

    historyRecorded = true;
    recordPreviewHistory(state.localPreviewHistory, previewId, code);

    if (historyBars) {
      historyBars.innerHTML = renderHistory(state.localPreviewHistory.get(previewId) || []);
    }
  };

  const setSignal = (label, code) => {
    if (previewLoadTokens.get(card) !== token) {
      return;
    }

    signalSlot.innerHTML = makeStatusPill(label, code);

    if (isLocal && statusSlot) {
      statusSlot.innerHTML = makeStatusPill(label, code);
      card.dataset.health = code;
    }
  };

  const startedAt = performance.now();
  const timer = window.setTimeout(() => {
    if (previewLoadTokens.get(card) !== token) {
      return;
    }

    slowMark = true;
    setSignal("No frame signal", "slow");
    pushHistory("slow");
  }, timeoutMs);

  iframe.addEventListener(
    "load",
    () => {
      if (previewLoadTokens.get(card) !== token) {
        return;
      }

      window.clearTimeout(timer);

      const duration = Math.round(performance.now() - startedAt);
      const code = slowMark ? "slow" : "live";
      const label = slowMark ? `Loaded slowly • ${duration} ms` : `Preview live • ${duration} ms`;

      setSignal(label, code);
      pushHistory(code);
    },
    { once: true }
  );

  if (options.reload) {
    try {
      iframe.contentWindow?.location.reload();
    } catch {
      iframe.src = iframe.src;
    }
  }
}

function wirePreviewSignals(container, isLocal) {
  for (const card of container.querySelectorAll(".site-card")) {
    startPreviewSignal(card, isLocal);
  }
}

function renderRecentProjects(targets) {
  const sorted = [...targets].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  const recent = sorted.slice(0, 3);

  elements.recentProjectsList.innerHTML = recent
    .map(
      (target, index) => `
        <div class="document-row">
          <span>
            <strong>${escapeHtml(target.label)}</strong>
            <small>Added ${escapeHtml(formatDate(target.addedAt))}</small>
          </span>
          <code>${escapeHtml(target.category)}</code>
        </div>
      `
    )
    .join("");
}

function renderPublishingSpeed(targets) {
  // Count projects by month to show "speed" over time
  const points = new Map();
  targets.forEach((t) => {
    if (!t.addedAt) return;
    const date = new Date(t.addedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    points.set(key, (points.get(key) || 0) + 1);
  });

  const sortedKeys = Array.from(points.keys()).sort();
  const max = Math.max(...points.values(), 1);

  elements.publishingGraph.innerHTML = `
    <div class="graph-container" style="display: flex; align-items: flex-end; gap: 8px; height: 100px; padding-top: 20px;">
      ${sortedKeys
        .map((key) => {
          const count = points.get(key);
          const height = (count / max) * 100;
          return `
          <div class="graph-bar-wrap" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <div class="graph-bar" style="width: 100%; height: ${height}px; background: var(--accent); border-radius: 2px; opacity: 0.8;" title="${key}: ${count} apps"></div>
            <span style="font-size: 8px; opacity: 0.5;">${key.split("-")[1]}</span>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

function renderHistoryGallery() {
  if (!elements.historyGallery) return;

  elements.historyGallery.innerHTML = ARCHIVE_IMAGES.map(
    (filename) => `
      <article class="history-card">
        <div class="history-mark">
          <img 
            class="history-image" 
            alt="Historical project snapshot: ${escapeHtml(filename)}" 
            loading="lazy" 
            src="./Old projects from archives/${encodeURIComponent(filename)}" 
          />
        </div>
        <div class="history-info">
          <p class="eyebrow">Project Archive</p>
          <span class="history-filename">${escapeHtml(filename)}</span>
        </div>
      </article>
    `
  ).join("");
}


const API_REGISTRY_GROUPS = [
  {
    id: "weather-climate",
    title: "Weather & Climate",
    why: "Real-time meteorological data drives advisories, transit guidance, and environmental overlays across city monitors and coastal dashboards.",
    apis: [
      { label: "Open-Meteo Forecast", provider: "Open-Meteo", kind: "external", usedBy: ["Middle East Monitor", "City Reporter Bot", "Tech Monitor", "Phuket Dashboard"] },
      { label: "Open-Meteo Air Quality", provider: "Open-Meteo", kind: "external", usedBy: ["Tech Monitor", "AirDnD Platform", "Phuket Dashboard"] },
      { label: "Air Quality Info", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] },
      { label: "Rainfall Status", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] },
      { label: "Environment Status", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] }
    ]
  },
  {
    id: "disaster-resilience",
    title: "Disaster & Resilience",
    why: "Continuous disaster feeds allow early warning and situational awareness for regions exposed to earthquakes, floods, and extreme weather.",
    apis: [
      { label: "NASA EONET Events", provider: "NASA", kind: "external", usedBy: ["Tech Monitor", "Phuket Dashboard"] },
      { label: "ReliefWeb Disasters", provider: "UN OCHA", kind: "external", usedBy: ["Tech Monitor", "Phuket Dashboard"] },
      { label: "GDACS Event Feed", provider: "GDACS (UN/EC)", kind: "external", usedBy: ["Middle East Monitor", "Phuket Dashboard"] },
      { label: "Copernicus Preview", provider: "Copernicus/ESA", kind: "internal", usedBy: ["Middle East Monitor"] },
      { label: "Early Warnings", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot", "City Reporter Bot v2"] },
      { label: "Resilience", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Flood Map WMS", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot v2"] },
      { label: "Fire Alerts", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] },
      { label: "Incident Feed", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] }
    ]
  },
  {
    id: "markets-economy",
    title: "Markets & Economy",
    why: "Financial feeds provide context for economic monitoring, policy dashboards, and regional stability assessment.",
    apis: [
      { label: "FX Rates (USD base)", provider: "ExchangeRate-API", kind: "external", usedBy: ["Tech Monitor", "Phuket Dashboard"] },
      { label: "Binance 24h Ticker", provider: "Binance", kind: "external", usedBy: ["Tech Monitor", "Phuket Dashboard"] },
      { label: "Markets Snapshot", provider: "Internal", kind: "internal", usedBy: ["Middle East Monitor", "Smart City Monitor", "MTT Smart City Monitor", "Phuket Dashboard"] },
      { label: "Ticker Feed", provider: "Internal", kind: "internal", usedBy: ["Middle East Monitor", "Phuket Dashboard"] },
      { label: "Conflict Trends", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] }
    ]
  },
  {
    id: "geospatial-mapping",
    title: "Geospatial & Mapping",
    why: "Layered map APIs are the backbone of smart city monitors, rendering projects, infrastructure, and live urban data on interactive maps.",
    apis: [
      { label: "Map Layers", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Map Features", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Map Layer Config", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] },
      { label: "Report GeoJSON", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot", "City Reporter Bot v2"] }
    ]
  },
  {
    id: "intelligence-briefings",
    title: "Intelligence & Briefings",
    why: "AI-generated intelligence packages and regional briefings synthesize multiple data streams into actionable summaries for decision-makers.",
    apis: [
      { label: "Regional Briefing", provider: "Internal", kind: "internal", usedBy: ["Middle East Monitor"] },
      { label: "Latest Briefing", provider: "Internal", kind: "internal", usedBy: ["MTT Smart City Monitor"] },
      { label: "Latest Intelligence", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot", "City Reporter Bot v2"] },
      { label: "Generate Intelligence", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot", "City Reporter Bot v2"] },
      { label: "Intelligence Convergence", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] },
      { label: "Intelligence Packages", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] }
    ]
  },
  {
    id: "news-media",
    title: "News & Media Monitoring",
    why: "Aggregated news, social listening, and media channel feeds keep operators informed of public sentiment and breaking developments.",
    apis: [
      { label: "Google News RSS", provider: "Google", kind: "external", usedBy: ["Dashboard (Mentions)"] },
      { label: "News Feed", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor", "City Reporter Bot", "City Reporter Bot v2", "Phuket Dashboard"] },
      { label: "Media Feeds", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Media Channels", provider: "Internal", kind: "internal", usedBy: ["MTT Smart City Monitor"] },
      { label: "Social Listening", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Social Analytics", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot", "City Reporter Bot v2"] },
      { label: "Trending Keywords", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] }
    ]
  },
  {
    id: "city-operations",
    title: "City Operations & Analytics",
    why: "Core operational endpoints drive the smart city monitoring consoles, delivering overview KPIs, activity logs, impact metrics, and domain-level analytics.",
    apis: [
      { label: "Overview", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Pulse", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Projects", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Activity", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Impact", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Changes", provider: "Internal", kind: "internal", usedBy: ["MTT Smart City Monitor"] },
      { label: "Cities", provider: "Internal", kind: "internal", usedBy: ["MTT Smart City Monitor"] },
      { label: "Domains", provider: "Internal", kind: "internal", usedBy: ["MTT Smart City Monitor"] },
      { label: "Indicators", provider: "Internal", kind: "internal", usedBy: ["MTT Smart City Monitor"] },
      { label: "Sources", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor", "Phuket Dashboard"] },
      { label: "Data Source Inventory", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] }
    ]
  },
  {
    id: "transit-mobility",
    title: "Transit & Mobility",
    why: "Transit APIs support rider-facing apps with route data, stop sequences, service advisories, and real-time departure guidance.",
    apis: [
      { label: "Routes", provider: "Internal", kind: "internal", usedBy: ["Phuket Smart Bus"] },
      { label: "Route Stops", provider: "Internal", kind: "internal", usedBy: ["Phuket Smart Bus"] },
      { label: "Service Advisories", provider: "Internal", kind: "internal", usedBy: ["Phuket Smart Bus"] },
      { label: "Leave-now Summary", provider: "Internal", kind: "internal", usedBy: ["Phuket Smart Bus"] },
      { label: "Movement Data", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] },
      { label: "Live Flight Data", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] },
      { label: "Phuket Ports", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot v2"] }
    ]
  },
  {
    id: "reporting-upload",
    title: "Reporting & Field Data",
    why: "Citizen reporting and field upload endpoints allow ground-level data collection, which feeds into early warning and intelligence systems.",
    apis: [
      { label: "Reports", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot", "City Reporter Bot v2"] },
      { label: "Upload", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot", "City Reporter Bot v2"] },
      { label: "Bangkok Open Data", provider: "Bangkok Metropolitan", kind: "external", usedBy: ["City Reporter Bot"] },
      { label: "Bangkok Datastore Proxy", provider: "Internal", kind: "internal", usedBy: ["City Reporter Bot v2"] }
    ]
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    why: "Built-in AI assistant endpoints let operators query the system in natural language for instant analysis and decision support.",
    apis: [
      { label: "Assistant Status", provider: "Internal", kind: "internal", usedBy: ["Smart City Monitor", "MTT Smart City Monitor"] },
      { label: "Assistant Query", provider: "Internal", kind: "internal", usedBy: ["MTT Smart City Monitor"] }
    ]
  },
  {
    id: "platform-infra",
    title: "Platform & Infrastructure",
    why: "Backend services, health checks, and third-party platform integrations keep the fleet running and observable.",
    apis: [
      { label: "Health Check", provider: "Internal", kind: "internal", usedBy: ["Phuket Smart Bus", "Dashboard"] },
      { label: "Broadcast Feed", provider: "Internal", kind: "internal", usedBy: ["AirDnD Platform"] },
      { label: "Supabase Backend", provider: "Supabase", kind: "external", usedBy: ["AirDnD Platform"] },
      { label: "ASEAN Profile", provider: "Internal", kind: "internal", usedBy: ["Phuket Dashboard"] }
    ]
  },
  {
    id: "github-devops",
    title: "GitHub & DevOps",
    why: "GitHub API powers the dashboard itself, pulling repository metadata, Pages status, and activity signals to monitor the entire codebase fleet.",
    apis: [
      { label: "GitHub Users API", provider: "GitHub", kind: "external", usedBy: ["Dashboard"] },
      { label: "GitHub Repos API", provider: "GitHub", kind: "external", usedBy: ["Dashboard"] },
      { label: "GitHub Repo Metadata", provider: "GitHub", kind: "external", usedBy: ["Dashboard"] },
      { label: "Dashboard API", provider: "Internal", kind: "internal", usedBy: ["Dashboard"] },
      { label: "Mentions API", provider: "Internal", kind: "internal", usedBy: ["Dashboard"] }
    ]
  }
];

function renderApiRegistry() {
  const registry = document.querySelector("#apiRegistry");
  if (!registry) return;

  let totalCount = 0;
  API_REGISTRY_GROUPS.forEach((g) => {
    g.apis.forEach((api) => {
      if (api.kind === "external" || api.kind === "internal") {
        totalCount++;
      }
    });
  });

  const groupsHtml = API_REGISTRY_GROUPS.map((group) => `
      <article class="registry-group" id="reg-${escapeHtml(group.id)}">
        <div class="registry-group-head">
          <div class="registry-group-title">
            <h3>${escapeHtml(group.title)}</h3>
            <span class="registry-count">${group.apis.length}</span>
          </div>
          <p class="registry-why">${escapeHtml(group.why)}</p>
        </div>
        <div class="registry-table">
          ${group.apis.map((api) => `
            <div class="registry-row">
              <span class="registry-api-name">${escapeHtml(api.label)}</span>
              <span class="registry-provider">${escapeHtml(api.provider)}</span>
              <code class="registry-kind">${escapeHtml(api.kind)}</code>
              <span class="registry-used-by">${api.usedBy.map((app) => `<span class="registry-app-tag">${escapeHtml(app)}</span>`).join("")}</span>
            </div>
          `).join("")}
        </div>
      </article>
    `).join("");

  registry.innerHTML = `
    <div class="registry-summary">
      <span class="registry-total">Targeting ${escapeHtml(totalCount)} live and external endpoints across the system.</span>
    </div>
    ${groupsHtml}
  `;
}

function renderUniversalBlueprint() {
  if (!elements.blueprintCode) return;

  const blueprint = {
    system: "Dr. Non's Operating Systems",
    owner: "Dr. Non Arkaraprasertkul",
    generatedAt: new Date().toISOString(),
    apiCatalog: API_REGISTRY_GROUPS.map((group) => ({
      category: group.title,
      description: group.why,
      endpoints: group.apis.map((api) => {
        let quality = "Standard";
        let limitation = "General system constraints apply.";

        if (api.kind === "external") {
          quality = "External Service (High Uptime)";
          limitation = "Rate-limited by provider; subject to upstream changes.";
        } else if (api.kind === "internal") {
          quality = "Core System API (Performance Optimized)";
          limitation = "Hosted on Render; initial cold start possible.";
        }

        return {
          label: api.label,
          provider: api.provider,
          kind: api.kind,
          quality,
          limitation,
          usedBy: api.usedBy
        };
      })
    }))
  };

  elements.blueprintCode.textContent = JSON.stringify(blueprint, null, 2);
}

async function handleBlueprintCopy() {
  const code = elements.blueprintCode.textContent;
  if (!code) return;

  const button = elements.copyBlueprintButton;
  const previousLabel = button.textContent;

  try {
    await navigator.clipboard.writeText(code);
    button.textContent = "Copied to Clipboard";
    window.setTimeout(() => {
      button.textContent = previousLabel;
    }, 2000);
  } catch (err) {
    button.textContent = "Copy failed";
    window.setTimeout(() => {
      button.textContent = previousLabel;
    }, 2000);
  }
}



function handlePreviewRefresh(event) {
  const button = event.target.closest("[data-refresh-preview]");

  if (!button) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const card = button.closest(".site-card");

  if (!card) {
    return;
  }

  startPreviewSignal(card, button.dataset.refreshPreview === "local", {
    reload: true
  });
}

function renderRemoteSections(targets) {
  const featuredTargets = targets.filter((target) => target.featured);
  const activeTargets = targets.filter((target) => target.surface === "active" && !target.featured);
  const staticTargets = targets.filter((target) => target.surface === "static");

  renderSection(
    elements.featuredGrid,
    featuredTargets.map((target) => buildRemoteCard(target, { featured: true })),
    "No featured deployment configured."
  );
  renderSection(
    elements.activeGrid,
    activeTargets.map((target) => buildRemoteCard(target)),
    "No active apps are configured."
  );
  renderSection(
    elements.staticGrid,
    staticTargets.map((target) => buildRemoteCard(target)),
    "No static pages are configured."
  );

  wirePreviewSignals(elements.featuredGrid, false);
  wirePreviewSignals(elements.activeGrid, false);
  wirePreviewSignals(elements.staticGrid, false);
  requestPreviewFrameSync();
}

function renderLocalTargets() {
  if (!state.localTargets.length) {
    elements.localGrid.innerHTML = `<div class="empty-state">No local targets saved on this machine yet.</div>`;
    requestPreviewFrameSync();
    return;
  }

  elements.localGrid.innerHTML = state.localTargets.map(buildLocalCard).join("");
  wirePreviewSignals(elements.localGrid, true);
  requestPreviewFrameSync();
}

function renderDashboard() {
  if (!state.dashboard) {
    return;
  }

  const { generatedAt, github, mentions, summary, targets } = state.dashboard;
  const snapshotBacked = state.lastLoadSource === "snapshot" || state.lastLoadSource === "snapshot-fallback";
  state.mentions = mentions || state.mentions || {
    checkedAt: generatedAt || null,
    error: "Mention snapshot unavailable.",
    items: [],
    latestAt: null,
    scannedAliases: [],
    searchUrl: "https://news.google.com/",
    source: "Mention sweep",
    status: "offline"
  };
  renderLabLogos();
  renderBrandStrip(targets);
  renderProfile(summary);
  renderFooter();
  renderMetrics(summary, github);
  renderMentions(state.mentions);
  renderGitHub(github);
  renderIssues(summary);
  renderApiInventory(targets, summary);
  renderRecentProjects(targets);
  renderPublishingSpeed(targets);
  renderApiRegistry();
  renderRemoteSections(targets);

  elements.lastChecked.textContent = snapshotBacked
    ? `Snapshot updated ${formatDate(generatedAt)}`
    : `Last live scan ${formatDate(generatedAt)}`;
  elements.dashboardState.className = snapshotBacked
    ? "status-pill status-pill-neutral"
    : "status-pill status-pill-live";
  elements.dashboardState.textContent = snapshotBacked
    ? `Snapshot • ${summary.liveCount}/${summary.monitoredPages} public pages healthy`
    : `${summary.liveCount}/${summary.monitoredPages} public pages healthy`;
  applyModeUI();

  if (window.location.hash) {
    const anchor = document.querySelector(window.location.hash);

    if (anchor) {
      window.requestAnimationFrame(() => {
        anchor.scrollIntoView({ behavior: "auto", block: "start" });
      });
    }
  }
}

async function fetchSnapshotDashboard(force = false) {
  const response = await fetch(getSnapshotUrl(force), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Snapshot returned ${response.status}`);
  }

  return response.json();
}

async function fetchLiveDashboard(force = false) {
  const query = force ? "?force=1" : "";
  const response = await fetch(`./api/dashboard${query}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Live API returned ${response.status}`);
  }

  return response.json();
}

async function fetchMentions(force = false) {
  const query = force ? "?force=1" : "";
  const response = await fetch(`./api/mentions${query}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Mentions API returned ${response.status}`);
  }

  return response.json();
}

async function refreshDashboard(force = false) {
  elements.dashboardState.className = "status-pill status-pill-loading";
  elements.dashboardState.textContent =
    state.mode === "live" ? "Running live scan" : "Loading snapshot";

  try {
    if (state.mode === "live") {
      try {
        state.dashboard = await fetchLiveDashboard(force);
        state.lastLoadSource = "live";
      } catch (error) {
        state.dashboard = await fetchSnapshotDashboard(true);
        state.lastLoadSource = "snapshot-fallback";
        renderDashboard();
        return;
      }
    } else {
      state.dashboard = await fetchSnapshotDashboard(force);
      state.lastLoadSource = "snapshot";
    }
    renderDashboard();
  } catch (error) {
    elements.dashboardState.className = "status-pill status-pill-error";
    elements.dashboardState.textContent = `Dashboard error: ${error.message}`;
    applyModeUI();
  }
}

async function refreshMentions(force = false) {
  elements.mentionsStatus.innerHTML = makeStatusPill("Refreshing", "loading");
  elements.mentionsMeta.textContent =
    state.mode === "live" ? "Running a fresh mention sweep." : "Reloading snapshot mentions.";

  try {
    const mentions = await fetchMentions(force);
    state.mentions = mentions;

    if (state.dashboard) {
      state.dashboard.mentions = mentions;
    }

    renderMentions(state.mentions);
  } catch (error) {
    if (!state.mentions) {
      state.mentions = {
        checkedAt: null,
        error: error.message,
        items: [],
        latestAt: null,
        scannedAliases: [],
        searchUrl: null,
        source: "Mention sweep",
        status: "offline"
      };
    }

    renderMentions(state.mentions);
    elements.mentionsMeta.textContent = `Mention refresh failed. ${error.message}`;
  }
}

function handleLocalSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.localForm);
  const label = String(formData.get("label") || "").trim();
  const url = String(formData.get("url") || "").trim();

  if (!label || !url) {
    return;
  }

  try {
    const normalized = new URL(url);
    state.localTargets.push({
      id: `local-${crypto.randomUUID()}`,
      label,
      url: normalized.toString()
    });
  } catch {
    elements.dashboardState.className = "status-pill status-pill-error";
    elements.dashboardState.textContent = "Invalid local target URL";
    return;
  }

  saveLocalTargets();
  elements.localForm.reset();
  renderLocalTargets();
}

function handleLocalClick(event) {
  const button = event.target.closest("[data-remove-index]");

  if (!button) {
    return;
  }

  const index = Number(button.dataset.removeIndex);

  if (!Number.isInteger(index)) {
    return;
  }

  state.localTargets.splice(index, 1);
  saveLocalTargets();
  renderLocalTargets();
}

async function handleTargetBlueprintCopy(event) {
  const button = event.target.closest("[data-copy-blueprint]");

  if (!button || !state.dashboard) {
    return;
  }

  const target = state.dashboard.targets.find((item) => item.id === button.dataset.copyBlueprint);

  if (!target) {
    return;
  }

  const previousLabel = button.textContent;

  try {
    await navigator.clipboard.writeText(JSON.stringify(buildStarterJson(target), null, 2));
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = previousLabel;
    }, 1600);
  } catch {
    button.textContent = "Copy failed";
    window.setTimeout(() => {
      button.textContent = previousLabel;
    }, 1600);
  }
}

function openAllTargets() {
  if (!state.dashboard) {
    return;
  }

  for (const target of state.dashboard.targets) {
    window.open(target.url, "_blank", "noopener,noreferrer");
  }
}

function bindEvents() {
  elements.refreshButton.addEventListener("click", () => refreshDashboard(true));
  elements.mentionsRefreshButton.addEventListener("click", () => refreshMentions(true));
  elements.openAllButton.addEventListener("click", openAllTargets);
  window.addEventListener("resize", requestPreviewFrameSync);
  elements.refreshSelect.addEventListener("change", (event) => {
    state.autoRefreshMs = Number(event.target.value);
    scheduleRefresh();
  });
  elements.featuredGrid.addEventListener("click", handlePreviewRefresh);
  elements.activeGrid.addEventListener("click", handlePreviewRefresh);
  elements.staticGrid.addEventListener("click", handlePreviewRefresh);
  elements.localGrid.addEventListener("click", handlePreviewRefresh);
  elements.featuredGrid.addEventListener("click", openPreview);
  elements.activeGrid.addEventListener("click", openPreview);
  elements.staticGrid.addEventListener("click", openPreview);
  elements.localGrid.addEventListener("click", openPreview);
  elements.featuredGrid.addEventListener("keydown", handlePreviewKeydown);
  elements.activeGrid.addEventListener("keydown", handlePreviewKeydown);
  elements.staticGrid.addEventListener("keydown", handlePreviewKeydown);
  elements.localGrid.addEventListener("keydown", handlePreviewKeydown);
  elements.featuredGrid.addEventListener("click", handleTargetBlueprintCopy);
  elements.activeGrid.addEventListener("click", handleTargetBlueprintCopy);
  elements.staticGrid.addEventListener("click", handleTargetBlueprintCopy);
  elements.localForm.addEventListener("submit", handleLocalSubmit);
  elements.localGrid.addEventListener("click", handleLocalClick);
}


function renderNovelSection() {
  const container = document.querySelector("#novelContent");
  if (!container) return;

  container.innerHTML = `
    <div class="novel-grid">
      <div class="novel-cover-wrap">
        <img src="${escapeHtml(NOVEL_DATA.coverImage)}" alt="${escapeHtml(NOVEL_DATA.title)}" class="novel-cover" />
        <div class="novel-badge">CLASSIFIED</div>
      </div>
      <div class="novel-details">
        <p class="novel-tagline">“${escapeHtml(NOVEL_DATA.tagline)}”</p>
        <p class="novel-summary">${escapeHtml(NOVEL_DATA.summary)}</p>
        <div class="novel-meta">
          <div class="novel-meta-item">
            <span class="meta-label">STATUS:</span>
            <span class="meta-value">DEPLOYING (CHAPTERS 1-3)</span>
          </div>
          <div id="novelChapters" class="novel-chapters">
            ${NOVEL_DATA.chapters.map(ch => `<div class="novel-chapter-tag">${escapeHtml(ch)}</div>`).join("")}
          </div>
        </div>
        <a href="${escapeHtml(NOVEL_DATA.url)}" target="_blank" class="button button-primary novel-cta">READ ON SUBSTACK</a>
      </div>
    </div>
  `;
}

bindEvents();
renderLabLogos();
renderProfile({ monitoredPages: 0 });
renderFooter();
renderMentions();
renderApiRegistry();
renderHistoryGallery();
renderUniversalBlueprint();
renderNovelSection();
startClock();
renderLocalTargets();
applyModeUI();
scheduleRefresh();
refreshDashboard(true);


if (elements.copyBlueprintButton) {
  elements.copyBlueprintButton.addEventListener("click", handleBlueprintCopy);
}

