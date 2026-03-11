const LOCAL_STORAGE_KEY = "operations-radar-local-targets";
const PORTRAIT_DEFAULT_PATH = "./media/profile/portrait-main.jpg";
const PORTRAIT_OVERRIDE_PATH = "./dr-non-photo.jpg";
const SNAPSHOT_PATH = "./data/dashboard-snapshot.json";
const MANUAL_SCAN_WORKFLOW_URL =
  "https://github.com/Nonarkara/dr-non-operating-systems/actions/workflows/update-dashboard-snapshot.yml";
const MODE_PARAM = new URLSearchParams(window.location.search).get("mode");

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

const PROFILE = {
  byline: "City systems strategist, anthropologist, writer, and builder.",
  summary:
    "Dr. Non Arkaraprasertkul designs and delivers city systems under real pressure. The work combines anthropology, policy architecture, implementation strategy, and AI-assisted software production into one operating practice.",
  mission:
    "This wall now serves as both live operations dashboard and CV surface: apps, deployments, publications, credentials, working photos, and downloadable profile material in one place.",
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
      label: "LinkedIn",
      meta: "Professional profile",
      url: "https://www.linkedin.com/in/drnon"
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
      label: "CV (English)",
      meta: "Updated July 2018 PDF",
      url: "./docs/cv-en.pdf"
    },
    {
      label: "CV (Thai)",
      meta: "October 2023 PDF",
      url: "./docs/cv-th.pdf"
    },
    {
      label: "Non Profile",
      meta: "Profile PDF",
      url: "./docs/non-profile.pdf"
    },
    {
      label: "SLIC Company Profile",
      meta: "Organizational profile PDF",
      url: "./docs/slic-company-profile.pdf"
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
  gallery: [
    {
      title: "Primary portrait",
      src: "./media/profile/portrait-main.jpg"
    },
    {
      title: "Studio portrait",
      src: "./media/profile/portrait-secondary.jpg"
    },
    {
      title: "Workshop keynote",
      src: "./media/gallery/workshop-keynote.jpg"
    },
    {
      title: "Award stage",
      src: "./media/gallery/award-stage.jpg"
    },
    {
      title: "Johor Smart City Forum",
      src: "./media/gallery/johor-forum.jpg"
    },
    {
      title: "SCTCDP dashboard",
      src: "./media/gallery/sctcdp-dashboard.png"
    },
    {
      title: "SLIC team",
      src: "./media/gallery/slic-team.jpg"
    }
  ],
  footer: {
    authorship:
      "This operating system and the underlying page set were authored by Dr. Non and assembled with AI-assisted workflows, including Claude Code, Anthropic Claude, Google services, ChatGPT Codex, and supporting digital tools. Final editorial direction, selection, and publication intent remain under Dr. Non's control.",
    lab:
      "This operation forms part of the Smart City Thailand Laboratory. We treat innovation as a service: useful systems are designed, tested, deployed, and shared as working infrastructure for civic, institutional, and collaborative use.",
    privacy:
      "This dashboard checks the status of listed public services, stores optional localhost targets only in the visitor's browser, and may process standard hosting and security logs for operational continuity. No sale of personal data is intended through this interface. Questions regarding access, correction, reuse, or removal should be directed to Dr. Non through the contact channels listed above.",
    copyright:
      "Copyright notice: Unless otherwise stated, original interface composition, written copy, curation, and locally hosted profile materials on this page are copyright Dr. Non and the Smart City Thailand Laboratory. Open-source stance: the preference is to collaborate, share, and give useful code away where practical. If you would like access to code, reuse permission, or a joint build, please make contact."
  }
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
  raat: {
    monogram: "RA"
  },
  "scl-landing-page": {
    monogram: "SL"
  },
  "slic-index-rankings": {
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
  mode: DATA_MODE,
  refreshTimer: null
};

const elements = {
  activeGrid: document.querySelector("#activeGrid"),
  apiGrid: document.querySelector("#apiGrid"),
  apiSummary: document.querySelector("#apiSummary"),
  authorshipNote: document.querySelector("#authorshipNote"),
  brandStrip: document.querySelector("#brandStrip"),
  clock: document.querySelector("#clock"),
  copyrightNote: document.querySelector("#copyrightNote"),
  dashboardState: document.querySelector("#dashboardState"),
  featuredGrid: document.querySelector("#featuredGrid"),
  githubSummary: document.querySelector("#githubSummary"),
  issueList: document.querySelector("#issueList"),
  labLogoStrip: document.querySelector("#labLogoStrip"),
  labStatement: document.querySelector("#labStatement"),
  languageList: document.querySelector("#languageList"),
  lastChecked: document.querySelector("#lastChecked"),
  localForm: document.querySelector("#localForm"),
  localGrid: document.querySelector("#localGrid"),
  metricsGrid: document.querySelector("#metricsGrid"),
  manualScanLink: document.querySelector("#manualScanLink"),
  modeNote: document.querySelector("#modeNote"),
  openAllButton: document.querySelector("#openAllButton"),
  platformList: document.querySelector("#platformList"),
  privacyStatement: document.querySelector("#privacyStatement"),
  profileCredentialTags: document.querySelector("#profileCredentialTags"),
  profileDocs: document.querySelector("#profileDocs"),
  profileGallery: document.querySelector("#profileGallery"),
  profileLinks: document.querySelector("#profileLinks"),
  profileMetricStrip: document.querySelector("#profileMetricStrip"),
  profilePublications: document.querySelector("#profilePublications"),
  profileSummary: document.querySelector("#profileSummary"),
  portraitFallback: document.querySelector("#portraitFallback"),
  portraitImage: document.querySelector("#portraitImage"),
  recentRepos: document.querySelector("#recentRepos"),
  refreshButton: document.querySelector("#refreshButton"),
  refreshSelect: document.querySelector("#refreshSelect"),
  staticGrid: document.querySelector("#staticGrid")
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

function makeStatusPill(label, code) {
  return `<span class="status-pill status-pill-${escapeHtml(code || "neutral")}">${escapeHtml(label)}</span>`;
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

  elements.profileGallery.innerHTML = PROFILE.gallery
    .map(
      (item) => `
        <figure class="photo-card">
          <img alt="${escapeHtml(item.title)}" loading="lazy" src="${escapeHtml(item.src)}" />
          <figcaption>${escapeHtml(item.title)}</figcaption>
        </figure>
      `
    )
    .join("");
}

function renderFooter() {
  elements.authorshipNote.innerHTML = `<p>${escapeHtml(PROFILE.footer.authorship)}</p>`;
  elements.labStatement.innerHTML = `<p>${escapeHtml(PROFILE.footer.lab)}</p>`;
  elements.privacyStatement.innerHTML = `<p>${escapeHtml(PROFILE.footer.privacy)}</p>`;
  elements.copyrightNote.textContent = `${PROFILE.footer.copyright} ${new Date().getFullYear()}.`;
}

function renderPlatforms(summary) {
  elements.platformList.innerHTML = summary.platformBreakdown
    .map((item) => `<span class="tag">${escapeHtml(item.platform)} ${escapeHtml(item.count)}</span>`)
    .join("");
}

function renderGitHub(github) {
  if (github.status !== "live" || !github.profile) {
    elements.githubSummary.innerHTML = `
      <div class="stat-row">
        <div class="stat-key">GitHub status</div>
        <div class="stat-value">Unavailable</div>
        <div>${escapeHtml(github.error || "GitHub metadata could not be loaded.")}</div>
      </div>
    `;
    elements.languageList.innerHTML = "";
    elements.recentRepos.innerHTML = "";
    return;
  }

  elements.githubSummary.innerHTML = `
    <div class="stat-grid">
      <div class="stat-row">
        <div class="stat-key">Profile</div>
        <div class="stat-value">${escapeHtml(github.profile.login)}</div>
        <a class="action-link" href="${escapeHtml(github.profile.url)}" rel="noreferrer" target="_blank">Open GitHub</a>
      </div>
      <div class="stat-row">
        <div class="stat-key">Public repos</div>
        <div class="stat-value">${escapeHtml(github.profile.publicRepos)}</div>
        <div>Updated ${escapeHtml(formatDate(github.profile.updatedAt))}</div>
      </div>
      <div class="stat-row">
        <div class="stat-key">GitHub Pages repos</div>
        <div class="stat-value">${escapeHtml(github.stats.githubPagesRepos)}</div>
        <div>Non-fork repos with Pages enabled</div>
      </div>
      <div class="stat-row">
        <div class="stat-key">Active last 30 days</div>
        <div class="stat-value">${escapeHtml(github.stats.activeLast30d)}</div>
        <div>${escapeHtml(github.profile.location || "Location unavailable")}</div>
      </div>
    </div>
  `;

  elements.languageList.innerHTML = github.stats.topLanguages
    .map((item) => `<span class="tag">${escapeHtml(item.name)} ${escapeHtml(item.count)}</span>`)
    .join("");

  elements.recentRepos.innerHTML = github.recentRepos
    .map(
      (repo) => `
        <article class="repo-item">
          <a href="${escapeHtml(repo.url)}" rel="noreferrer" target="_blank">${escapeHtml(repo.name)}</a>
          <div>${escapeHtml(repo.description || "No description")}</div>
          <div class="minor-meta">
            <span>${escapeHtml(repo.language || "Unknown language")}</span>
            <span>${repo.hasPages ? "Pages on" : "Pages off"}</span>
            <span>Pushed ${escapeHtml(formatDate(repo.pushedAt))}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderIssues(summary) {
  if (!summary.issues.length) {
    elements.issueList.innerHTML = `<div class="empty-state">No current issues detected across the monitored public pages.</div>`;
    return;
  }

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

      <div class="preview-shell">
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

      <div class="preview-shell">
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
        <a class="action-link" href="${escapeHtml(target.url)}" rel="noreferrer" target="_blank">Open target</a>
        <button class="button remove-button" data-remove-index="${index}" type="button">Remove</button>
      </div>
    </article>
  `;
}

function renderSection(container, cards, emptyMessage) {
  container.innerHTML = cards.length ? cards.join("") : `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
}

function wirePreviewSignals(container, isLocal) {
  const cards = [...container.querySelectorAll(".site-card")];

  for (const card of cards) {
    const previewId = card.dataset.previewId;
    const signalSlot = card.querySelector(".preview-signal");
    const statusSlot = card.querySelector(".card-status");
    const iframe = card.querySelector("iframe");
    const historyBars = isLocal ? card.querySelector(".history-bars") : null;

    if (!signalSlot || !iframe) {
      continue;
    }

    const timeoutMs = 12_000;
    let resolved = false;
    let slowMark = false;
    let historyRecorded = false;
    const startedAt = performance.now();

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
      signalSlot.innerHTML = makeStatusPill(label, code);

      if (isLocal && statusSlot) {
        statusSlot.innerHTML = makeStatusPill(label, code);
        card.dataset.health = code;
      }
    };

    const timer = window.setTimeout(() => {
      if (resolved) {
        return;
      }

      slowMark = true;
      setSignal("No frame signal", "slow");
      pushHistory("slow");
    }, timeoutMs);

    iframe.addEventListener(
      "load",
      () => {
        if (resolved) {
          return;
        }

        resolved = true;
        window.clearTimeout(timer);

        const duration = Math.round(performance.now() - startedAt);
        const code = slowMark ? "slow" : "live";
        const label = slowMark ? `Loaded slowly • ${duration} ms` : `Preview live • ${duration} ms`;

        setSignal(label, code);
        pushHistory(code);
      },
      { once: true }
    );
  }
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
}

function renderLocalTargets() {
  if (!state.localTargets.length) {
    elements.localGrid.innerHTML = `<div class="empty-state">No local targets saved on this machine yet.</div>`;
    return;
  }

  elements.localGrid.innerHTML = state.localTargets.map(buildLocalCard).join("");
  wirePreviewSignals(elements.localGrid, true);
}

function renderDashboard() {
  if (!state.dashboard) {
    return;
  }

  const { generatedAt, github, summary, targets } = state.dashboard;
  const snapshotBacked = state.lastLoadSource === "snapshot" || state.lastLoadSource === "snapshot-fallback";
  renderLabLogos();
  renderBrandStrip(targets);
  renderProfile(summary);
  renderFooter();
  renderMetrics(summary, github);
  renderPlatforms(summary);
  renderGitHub(github);
  renderIssues(summary);
  renderApiInventory(targets, summary);
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

function setupPortraitSlot() {
  elements.portraitImage.src = PORTRAIT_DEFAULT_PATH;
  elements.portraitImage.hidden = false;
  elements.portraitFallback.hidden = true;

  elements.portraitImage.addEventListener(
    "error",
    () => {
      elements.portraitImage.hidden = true;
      elements.portraitFallback.hidden = false;
    },
    { once: true }
  );

  const probe = new Image();

  probe.addEventListener("load", () => {
    elements.portraitImage.src = PORTRAIT_OVERRIDE_PATH;
    elements.portraitImage.hidden = false;
    elements.portraitFallback.hidden = true;
  });

  probe.src = `${PORTRAIT_OVERRIDE_PATH}?t=${Date.now()}`;
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

async function handleBlueprintCopy(event) {
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
  elements.openAllButton.addEventListener("click", openAllTargets);
  elements.refreshSelect.addEventListener("change", (event) => {
    state.autoRefreshMs = Number(event.target.value);
    scheduleRefresh();
  });
  elements.featuredGrid.addEventListener("click", handleBlueprintCopy);
  elements.activeGrid.addEventListener("click", handleBlueprintCopy);
  elements.staticGrid.addEventListener("click", handleBlueprintCopy);
  elements.localForm.addEventListener("submit", handleLocalSubmit);
  elements.localGrid.addEventListener("click", handleLocalClick);
}

bindEvents();
setupPortraitSlot();
renderLabLogos();
renderProfile({ monitoredPages: 0 });
renderFooter();
startClock();
renderLocalTargets();
applyModeUI();
scheduleRefresh();
refreshDashboard(true);
