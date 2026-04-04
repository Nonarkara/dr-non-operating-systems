export const GITHUB_USERNAME = "Nonarkara";
export const GITHUB_REPO = "Nonarkara/dr-non-operating-systems";
export const SNAPSHOT_COMMITS_PATH = "public/data/dashboard-snapshot.json";

export const MENTION_ALIASES = [
  "Dr Non Arkaraprasertkul",
  "นน อัครประเสริฐกุล",
  "Non Arkara",
  "นนท์ อัครประเสริฐกุล"
];

export const MENTION_QUERY = MENTION_ALIASES.map((alias) => `"${alias}"`).join(" OR ");
export const MENTION_SOURCE = "Google News";

export const MENTION_FEEDS = [
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

export const TARGETS = [
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
    id: "middle-east-monitor",
    label: "Middle East Monitor",
    url: "https://middle-east-monitor.onrender.com",
    description: "Regional monitoring dashboard deployed on Render.",
    category: "Monitoring",
    featured: true,
    surface: "active",
    addedAt: "2025-01-10"
  },
  {
    id: "geopolitics-dashboard",
    label: "Geopolitics Dashboard",
    url: "https://geopolitics-dashboard.onrender.com",
    description: "Geopolitical dashboard deployed on Render.",
    category: "Monitoring",
    surface: "active",
    addedAt: "2025-02-15"
  },
  {
    id: "city-reporter-bot",
    label: "City Reporter Bot",
    url: "https://city-reporter-bot.onrender.com",
    description: "Command center and reporting bot interface.",
    category: "Bot",
    surface: "active",
    addedAt: "2025-03-01"
  },
  {
    id: "city-reporter-bot-v2",
    label: "City Reporter Bot Version 2",
    url: "https://city-reporter-line-bot.onrender.com",
    description: "Version 2 of the command center and reporting bot interface.",
    category: "Bot",
    surface: "active",
    addedAt: "2026-03-14"
  },
  {
    id: "smart-city-monitor",
    label: "Smart City Monitor",
    url: "https://smart-city-monitor-web.onrender.com/?lang=en&view=city&timeRange=7d&city=bangkok&layers=smart-city-thailand%2Cbangkok-passages%2Cprojects%2Cnews%2Cresilience%2Ceconomy%2Cweather%2Cpollution",
    description: "Bangkok-focused smart city monitor with layered geospatial filters.",
    category: "Monitoring",
    surface: "active",
    addedAt: "2025-03-05"
  },
  {
    id: "mtt-smart-city-monitor",
    label: "MTT Smart City Monitor",
    url: "https://mtt-smart-city-monitor-web.onrender.com",
    description: "IMPACT Muang Thong Thani super dashboard with live city signals, domains, media, and assistant tooling.",
    category: "Monitoring",
    surface: "active",
    addedAt: "2025-03-08"
  },
  {
    id: "phuket-smart-bus",
    label: "Phuket Smart Bus",
    url: "https://phuket-smart-bus-y6tj.onrender.com",
    description: "Phone-first rider prototype with live tracking, advisories, and leave-now guidance.",
    category: "Transit",
    surface: "active",
    addedAt: "2025-03-10"
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
    id: "tech-monitor",
    label: "Tech Monitor",
    url: "https://tech-monitor.onrender.com",
    description: "Technology monitoring deployment on Render.",
    category: "Monitoring",
    surface: "active",
    addedAt: "2025-03-12"
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
    id: "slic-index-rankings",
    label: "SLIC Index Rankings",
    url: "https://slic-index.onrender.com/rankings",
    description: "Render-hosted SLIC index rankings surface.",
    category: "Index",
    surface: "active",
    addedAt: "2025-03-13"
  },
  {
    id: "slic-index-v2",
    label: "SLIC Index Version 2",
    url: "https://nonarkara.github.io/slic-index-V2/",
    description: "Second-generation Smart and Liveable Cities Index experience.",
    repo: "Nonarkara/slic-index-V2",
    category: "Index",
    surface: "static",
    addedAt: "2026-03-14"
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
    id: "airdnd-platform",
    label: "AirDnD Platform",
    url: "https://airdnd-platform.onrender.com",
    description: "AirDnD public platform deployment.",
    category: "Platform",
    surface: "active",
    addedAt: "2025-03-13"
  },
  {
    id: "phuket-dashboard",
    label: "Phuket Dashboard",
    url: "https://phuket-dashboard.onrender.com",
    description: "Coastal operations dashboard for Phuket and surrounding provinces.",
    category: "Monitoring",
    featured: true,
    surface: "active",
    addedAt: "2026-03-13"
  },
  {
    id: "sabai-sabai",
    label: "Sabai Sabai",
    url: "https://sabai-sabai-kohl.vercel.app",
    description: "Sabai Sabai platform on Vercel.",
    category: "Platform",
    surface: "active",
    addedAt: "2026-03-26"
  },
  {
    id: "axiom",
    label: "Axiom AI",
    url: "https://axiom-mu-six.vercel.app",
    description: "Axiom - Innovation as a Service. AI consultancy landing page on Vercel.",
    category: "Landing page",
    surface: "active",
    addedAt: "2026-03-26"
  },
  {
    id: "geopolitics-dashboard-vercel",
    label: "Geopolitics Dashboard (Vercel)",
    url: "https://geopolitics-dashboard-sage.vercel.app",
    description: "Vercel backup of the Geopolitics Dashboard.",
    category: "Monitoring",
    surface: "active",
    addedAt: "2026-03-26"
  },
  {
    id: "dngws-monitor",
    label: "DNGWS Monitor",
    url: "https://dngws-monitor.vercel.app/",
    description: "Vercel backup of the Middle East Monitor (Dr Non's GlobeWatch System).",
    category: "Monitoring",
    surface: "active",
    addedAt: "2026-03-26"
  },
  {
    id: "phuket-dashboard-vercel",
    label: "Phuket Dashboard (Vercel)",
    url: "https://phuket-dashboard.vercel.app",
    description: "Vercel backup of the Phuket coastal operations dashboard.",
    category: "Monitoring",
    surface: "active",
    addedAt: "2026-03-26"
  },
  {
    id: "smart-city-thailand-index",
    label: "Smart City Thailand Index",
    url: "https://smart-city-thailand-index-mq0oj23o5-nonarkaras-projects.vercel.app",
    description: "Smart City Thailand Index - city ranking and benchmarking platform on Vercel.",
    category: "Index",
    surface: "active",
    addedAt: "2026-04-02"
  }
];

export const API_INVENTORY = {
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
  "city-reporter-bot-v2": [
    { label: "Reports", url: "/api/reports", kind: "internal" },
    { label: "Report GeoJSON", url: "/api/reports/geojson", kind: "internal" },
    { label: "Early warnings", url: "/api/early-warnings", kind: "internal" },
    { label: "Upload", url: "/api/upload", kind: "internal" },
    { label: "Social analytics", url: "/api/analytics/social", kind: "internal" },
    { label: "Latest intelligence", url: "/api/intelligence/latest", kind: "internal" },
    { label: "Generate intelligence", url: "/api/intelligence/generate", kind: "internal" },
    { label: "News", url: "/api/news", kind: "internal" },
    { label: "Flood map WMS", url: "/api/2.0/resources/maps/flood/7days/wms", kind: "internal" },
    { label: "Phuket ports", url: "/api/marine/phuket-ports", kind: "internal" },
    {
      label: "Bangkok datastore proxy",
      url: "/api/3/action/datastore_search?resource_id=8f1102d5-52a2-4494-9131-403e4f87a242&limit=100",
      kind: "internal"
    }
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
  "phuket-dashboard": [
    { label: "News Aggregator", url: "/api/news", kind: "internal" },
    { label: "Environment Status", url: "/api/environment", kind: "internal" },
    { label: "Intelligence Convergence", url: "/api/intelligence/convergence", kind: "internal" },
    { label: "ASEAN Profile", url: "/api/asean/profile?country=THA", kind: "internal" },
    { label: "Incident Feed", url: "/api/incidents", kind: "internal" },
    { label: "Fire Alerts", url: "/api/fires", kind: "internal" },
    { label: "Movement Data", url: "/api/movements", kind: "internal" },
    { label: "Rainfall Status", url: "/api/rainfall", kind: "internal" },
    { label: "Air Quality Info", url: "/api/air-quality", kind: "internal" },
    { label: "Live Flight Data", url: "/api/flights", kind: "internal" },
    { label: "Market Radar", url: "/api/markets", kind: "internal" },
    { label: "Conflict Trends", url: "/api/conflict-trends", kind: "internal" },
    { label: "Ticker Feed", url: "/api/ticker", kind: "internal" },
    { label: "Intelligence Packages", url: "/api/intelligence/packages", kind: "internal" },
    { label: "Trending Keywords", url: "/api/trends", kind: "internal" },
    { label: "Data Source Inventory", url: "/api/sources", kind: "internal" },
    { label: "Map Layer Config", url: "/api/map/overlays", kind: "internal" },
    { label: "NASA EONET", url: "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30", kind: "external" },
    { label: "ReliefWeb disasters", url: "https://api.reliefweb.int/v1/disasters?appname=techmonitor", kind: "external" },
    { label: "Open-Meteo forecast", url: "https://api.open-meteo.com/v1/forecast", kind: "external" },
    { label: "Open-Meteo air quality", url: "https://air-quality-api.open-meteo.com/v1/air-quality", kind: "external" },
    { label: "GDACS event feed", url: "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH", kind: "external" },
    { label: "FX rates", url: "https://open.er-api.com/v6/latest/USD", kind: "external" },
    { label: "Binance ticker", url: "https://api.binance.com/api/v3/ticker/24hr", kind: "external" }
  ],
  "scl-landing-page": [],
  raat: [],
  "techhuntthailand-viabus": []
};
