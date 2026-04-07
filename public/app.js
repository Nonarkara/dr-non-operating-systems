const LOCAL_STORAGE_KEY = "operations-radar-local-targets";
const SNAPSHOT_PATH = "./data/dashboard-snapshot.json";
const MANUAL_SCAN_WORKFLOW_URL =
  "https://github.com/Nonarkara/dr-non-operating-systems/actions/workflows/update-dashboard-snapshot.yml";
const MODE_PARAM = new URLSearchParams(window.location.search).get("mode");
const PREVIEW_VIEWPORT = {
  width: 1600,
  height: 900
};

const GITHUB_REPO = "Nonarkara/dr-non-operating-systems";
const SNAPSHOT_COMMITS_PATH = "public/data/dashboard-snapshot.json";

/* ============================================================
   SVG Primitive Library — all inline, zero dependencies
   ============================================================ */

const SVG = {
  arcGauge(value, max, size = 120, opts = {}) {
    const pct = max > 0 ? Math.min(value / max, 1) : 0;
    const r = (size - 12) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;
    const dash = circ * pct;
    const gap = circ - dash;
    const color = opts.color || (pct >= 0.9 ? "var(--success)" : pct >= 0.5 ? "var(--warning)" : "var(--danger)");
    const invert = opts.invert;
    const displayPct = invert ? (max > 0 ? Math.round((1 - value / max) * 100) : 0) : Math.round(pct * 100);
    const label = opts.label || "";
    const displayValue = opts.displayValue || String(Math.round(value));

    return `<svg class="svg-gauge" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${escapeHtml(label || 'gauge')}: ${escapeHtml(displayValue)}"
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="6" opacity="0.3"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="6"
        stroke-dasharray="${dash} ${gap}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})" class="svg-gauge-arc"/>
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--text-bright)" font-size="${size * 0.22}px" font-weight="700" font-family="var(--font-mono)">${escapeHtml(displayValue)}</text>
      <text x="${cx}" y="${cy + size * 0.14}" text-anchor="middle" fill="var(--muted-strong)" font-size="${size * 0.1}px" font-family="var(--font-mono)" text-transform="uppercase">${escapeHtml(label)}</text>
    </svg>`;
  },

  donut(segments, size = 160, opts = {}) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (!total) return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${(size-16)/2}" fill="none" stroke="var(--line)" stroke-width="10" opacity="0.2"/></svg>`;
    const r = (size - 16) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const arcs = segments.map((seg) => {
      const pct = seg.value / total;
      const dash = circ * pct;
      const gap = circ - dash;
      const arc = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="10"
        stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})" opacity="0.85"/>`;
      offset += dash;
      return arc;
    });
    const centerLabel = opts.centerLabel || String(total);
    const legend = segments.filter((s) => s.value > 0).map((s) => `
      <span class="donut-legend-item"><span class="donut-legend-dot" style="background:${s.color}"></span>${escapeHtml(s.label)} <strong>${s.value}</strong></span>
    `).join("");

    return `<div class="donut-wrap">
      <svg class="svg-donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        ${arcs.join("")}
        <text x="${cx}" y="${cy + 2}" text-anchor="middle" fill="var(--text-bright)" font-size="${size * 0.16}px" font-weight="700" font-family="var(--font-mono)">${escapeHtml(centerLabel)}</text>
      </svg>
      <div class="donut-legend">${legend}</div>
    </div>`;
  },

  sparkline(points, width = 120, height = 28, opts = {}) {
    if (!points.length) return "";
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const step = width / Math.max(points.length - 1, 1);
    const coords = points.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / range) * (height - 4)).toFixed(1)}`).join(" ");
    const color = opts.color || "var(--accent)";
    const fillCoords = `0,${height} ${coords} ${width},${height}`;

    return `<svg class="svg-sparkline" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none" role="img" aria-label="Response time trend">
      <polygon points="${fillCoords}" fill="${color}" opacity="0.1"/>
      <polyline points="${coords}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  },

  miniRing(pct, size = 20, opts = {}) {
    if (pct == null) return `<span class="mini-ring-empty" style="width:${size}px;height:${size}px"></span>`;
    const r = (size - 4) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;
    const dash = circ * (pct / 100);
    const gap = circ - dash;
    const color = opts.color || (pct >= 99 ? "var(--success)" : pct >= 90 ? "var(--accent-green)" : pct >= 50 ? "var(--warning)" : "var(--danger)");

    return `<svg class="svg-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${Math.round(pct)}% uptime" title="${Math.round(pct)}%">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="2.5" opacity="0.25"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2.5"
        stroke-dasharray="${dash} ${gap}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"/>
    </svg>`;
  },

  stackedBar(segments, width = 200, height = 12) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (!total) return "";
    let x = 0;
    const rects = segments.filter((s) => s.value > 0).map((seg) => {
      const w = (seg.value / total) * width;
      const rect = `<rect x="${x.toFixed(1)}" y="0" width="${Math.max(w, 1).toFixed(1)}" height="${height}" fill="${seg.color}" rx="1" opacity="0.8">
        <title>${escapeHtml(seg.label)}: ${seg.value} (${Math.round(seg.value / total * 100)}%)</title>
      </rect>`;
      x += w;
      return rect;
    });

    return `<svg class="svg-stacked-bar" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${rects.join("")}</svg>`;
  }
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
  { file: "1773133828362.png",                                  label: "Natural Language Coding — the discovery moment",   tag: "prototype" },
  { file: "1773377092111.jpg",                                  label: "Dashboard prototype v1",                           tag: "prototype" },
  { file: "1773570166448.jpg",                                  label: "City monitoring system — early build",             tag: "prototype" },
  { file: "1773570182857.jpg",                                  label: "Data visualization prototype",                     tag: "prototype" },
  { file: "1773570204010.jpg",                                  label: "Super Dashboard — city intelligence layer",        tag: "prototype" },
  { file: "1773570212485.jpg",                                  label: "Smart city interface",                             tag: "prototype" },
  { file: "1773570231976.jpg",                                  label: "Analytics prototype",                              tag: "prototype" },
  { file: "1773570244976.jpg",                                  label: "Operations dashboard",                             tag: "prototype" },
  { file: "Screenshot 2569-02-04 at 00.06.38.png",             label: "Early build — Feb 2026",                          tag: "build" },
  { file: "Screenshot 2569-02-04 at 00.25.43.png",             label: "Prototype session — Feb 2026",                    tag: "build" },
  { file: "Screenshot 2569-02-06 at 11.56.50.png",             label: "Interface iteration — Feb 2026",                  tag: "build" },
  { file: "Screenshot 2569-02-06 at 11.58.59.png",             label: "Dashboard build — Feb 2026",                      tag: "build" },
  { file: "Screenshot 2569-02-07 at 18.06.29.png",             label: "System prototype — Feb 2026",                     tag: "build" },
  { file: "Screenshot 2569-02-12 at 16.00.30.png",             label: "Data layer integration — Feb 2026",               tag: "build" },
  { file: "Screenshot 2569-02-20 at 00.42.10.png",             label: "API integration test — Feb 2026",                 tag: "build" },
  { file: "Screenshot 2569-02-23 at 23.39.00.png",             label: "Live system test — Feb 2026",                     tag: "build" },
  { file: "Screenshot 2569-02-23 at 23.40.48.png",             label: "Deployment test — Feb 2026",                      tag: "build" },
  { file: "Screenshot 2569-02-24 at 23.33.01.png",             label: "Production check — Feb 2026",                     tag: "build" },
  { file: "Screenshot 2569-02-25 at 14.00.11.png",             label: "System audit — Feb 2026",                         tag: "build" },
  { file: "Screenshot 2569-02-25 at 16.47.50.png",             label: "Build verification — Feb 2026",                   tag: "build" },
  { file: "Screenshot 2569-03-10 at 16.12.05.png",             label: "Fleet overview — Mar 2026",                       tag: "build" },
  { file: "Screenshot 2569-03-10 at 16.15.00.png",             label: "Dashboard state — Mar 2026",                      tag: "build" },
  { file: "Screenshot 2569-03-10 at 16.16.22.png",             label: "Operations review — Mar 2026",                    tag: "build" },
  { file: "Screenshot 2569-03-10 at 16.28.33.png",             label: "System snapshot — Mar 2026",                      tag: "build" },
  { file: "Screenshot 2569-03-10 at 16.29.58.png",             label: "Status check — Mar 2026",                         tag: "build" },
  { file: "Screenshot 2569-03-11 at 12.10.19.png",             label: "GlobeWatch — global coverage view",               tag: "build" },
  { file: "Screenshot 2569-03-11 at 13.59.34.png",             label: "Fleet status — Mar 2026",                         tag: "build" },
  { file: "Screenshot 2569-03-11 at 14.56.54.png",             label: "Full system audit — Mar 2026",                    tag: "build" },
  { file: "Screenshot 2569-03-11 at 15.04.33.png",             label: "Render deployment — machines obey",               tag: "build" },
  { file: "WhatsApp Image 2025-11-23 at 12.07.37 PM.jpeg",     label: "Field session — Nov 2025",                        tag: "field" },
  { file: "Thailand Tri-Border Command v4.jpg",                 label: "Thailand Tri-Border Command v4.3.9",              tag: "live" },
  { file: "SLIC Index 2026 V2.jpg",                            label: "SLIC Index 2026 V2",                              tag: "live" },
  { file: "GlobeWatch System Middle East.jpg",                  label: "GlobeWatch System: Middle East Theater",          tag: "live" },
  { file: "Muang Thong Thani Monitor.jpg",                      label: "Muang Thong Thani Smart City Monitor",            tag: "live" },
  { file: "Phuket Island Command.jpg",                          label: "Phuket Island Command Center",                    tag: "live" }
];

const FIELD_PHOTOS = [
  { file: "0811bc15-651f-4dde-81af-46580fa9a795.jpg",                     caption: "Stakeholder session",                        location: "Thailand" },
  { file: "290811441_5153495211364296_8102218306877593840_n.jpeg",         caption: "Community engagement forum",                 location: "Thailand" },
  { file: "2b398e91-e7cd-48bd-abbd-7d0e093e2c28(1).jpg",                  caption: "Workshop documentation",                     location: "Thailand" },
  { file: "403599058_1797525000701507_153970454313690316_n.jpg",           caption: "Officials briefing session",                 location: "Thailand" },
  { file: "459288254_924132223081934_9217219278417242092_n.jpg",           caption: "Stakeholder alignment meeting",               location: "Thailand" },
  { file: "CQW03907.jpg",                                                  caption: "Conference plenary",                         location: "Thailand" },
  { file: "DAY1_0368.jpg",                                                 caption: "Workshop Day 1 — opening session",           location: "Thailand" },
  { file: "DSC_2572.jpg",                                                  caption: "Field documentation",                        location: "Thailand" },
  { file: "E81F03FB-1399-4820-87A3-17C837902545.jpeg",                    caption: "Decision-making workshop",                   location: "Thailand" },
  { file: "FFC74093-8656-4C1A-904C-EF1B5461267D.jpeg",                    caption: "Stakeholder briefing",                       location: "Thailand" },
  { file: "IMG_2457.JPG",                                                  caption: "Field session",                              location: "Thailand" },
  { file: "IMG_3687.JPG",                                                  caption: "Province-level workshop",                    location: "Thailand" },
  { file: "IMG_4446.JPG",                                                  caption: "Stakeholder forum",                          location: "Thailand" },
  { file: "IMG_4505.JPG",                                                  caption: "Community workshop",                         location: "Thailand" },
  { file: "IMG_6359.JPG",                                                  caption: "Field session",                              location: "Thailand" },
  { file: "IMG_6651.JPG",                                                  caption: "Workshop engagement",                        location: "Thailand" },
  { file: "LINE_ALBUM_Mini MBA 18 NOV 2023_231120_11.jpg",                caption: "Mini MBA Workshop",                          location: "Nov 2023" },
  { file: "Screenshot 2569-03-08 at 10.24.44.png",                        caption: "Workshop data capture",                      location: "Mar 2026" },
  { file: "Screenshot 2569-03-09 at 04.43.16.png",                        caption: "Session documentation",                      location: "Mar 2026" },
  { file: "Screenshot 2569-03-09 at 13.16.17.png",                        caption: "Field records",                              location: "Mar 2026" },
  { file: "Screenshot 2569-03-09 at 18.09.52.png",                        caption: "Stakeholder analysis",                       location: "Mar 2026" },
  { file: "Screenshot 2569-03-09 at 18.28.46.png",                        caption: "Workshop output",                            location: "Mar 2026" },
  { file: "Screenshot 2569-03-09 at 23.09.13.png",                        caption: "Data synthesis",                             location: "Mar 2026" },
  { file: "Screenshot 2569-03-18 at 13.43.58.png",                        caption: "Workshop output",                            location: "Mar 2026" },
  { file: "Screenshot 2569-03-18 at 13.52.42.png",                        caption: "Session summary",                            location: "Mar 2026" },
  { file: "Screenshot 2569-03-18 at 13.53.35.png",                        caption: "Field intelligence record",                  location: "Mar 2026" },
  { file: "Smart Cities _ Nex Big Tech Event Cam B_1144.jpg",             caption: "Smart Cities Next Big Tech Event",           location: "Bangkok" },
  { file: "Smart Cities _ Nex Big Tech Event Cam B_1184.jpg",             caption: "Smart Cities Next Big Tech Event",           location: "Bangkok" },
  { file: "Timeline photos(1).jpg",                                        caption: "Project timeline documentation",             location: "Thailand" },
  { file: "Timeline photos(2).jpg",                                        caption: "Development history record",                 location: "Thailand" },
  { file: "Timeline photos.jpg",                                           caption: "Field research overview",                    location: "Thailand" },
  { file: "WhatsApp Image 2023-03-17 at 05.20.05 (1).jpeg",              caption: "Field session",                              location: "Mar 2023" }
];

const FIELD_RECORD = {
  stats: [
    { value: "200+", label: "Workshops" },
    { value: "77", label: "Provinces" },
    { value: "5,000+", label: "Officials" },
    { value: "Pre-AI", label: "Documentation" },
    { value: "100+", label: "Global Forums" }
  ],
  acts: [
    {
      number: "PHASE I",
      title: "The Listening Protocol",
      body: "Before any index, before any dashboard, there were rooms full of people. Over several years Dr. Non designed and ran more than 200 decision-making workshops across Thailand — structured sessions built to surface what city officials, residents, and planners actually needed, not what technologists assumed they needed."
    },
    {
      number: "PHASE II",
      title: "Pre-AI Documentation",
      body: "This work began before large language models existed to help transcribe, summarize, or synthesize. Every session was documented by hand — notes, photos, diagrams, recordings. The discipline of capturing human intelligence before machine intelligence became the methodology that now powers the Index."
    },
    {
      number: "PHASE III",
      title: "77 Provinces, One Index",
      body: "Coverage extended across all 77 Thai provinces, reaching officials at every administrative tier. The diversity of contexts — from dense urban cores to remote rural districts — forced the index framework to remain flexible, human-readable, and grounded in lived experience rather than top-down theory."
    },
    {
      number: "PHASE IV",
      title: "Data From Real People",
      body: "Every metric in the SLIC Index traces back to this field record. The dashboards are fast, the APIs are live, the AI is deployed — but the intelligence underneath it all came from listening, systematically, to real people, in real rooms, over real years."
    }
  ]
};

const PORTRAITS = [
  { file: "1773314596245 (1).jpg", caption: "depa HQ, Bangkok" },
  { file: "IMG_20250925_140828_004~2.jpg", caption: "Formal profile" }
];

const ORIGIN_STORY = {
  title: "The Origin Story",
  subtitle: "How one man decided to mass-produce the future by talking to machines",
  portrait: {
    operator: "./Portraits/1773314596245 (1).jpg",
    formal: "./Portraits/IMG_20250925_140828_004~2.jpg"
  },
  acts: [
    {
      number: "ACT I",
      title: "THE CREDENTIALS",
      body: "MIT. Harvard. Oxford. A Bangkok kid with round glasses collected degrees like weapons from elite dungeons. Architecture at KMITL. Urban studies at MIT. A PhD at Harvard on how actual humans live in actual cities. An MPhil at Oxford because why not. Years of publishing in journals that maybe twelve people read. The system was supposed to reward this. It didn't. The system rewarded PowerPoints, committees, and people who could smile through four-hour meetings about nothing. Non took notes. Non built rage.",
      image: "./Portraits/IMG_20250925_140828_004~2.jpg",
      imageCaption: "The formal weapon. Every credential earned the hard way."
    },
    {
      number: "ACT II",
      title: "THE DISCOVERY",
      body: "Then the world changed overnight and nobody noticed. Large language models arrived. Everyone saw a chatbot. Non saw a factory. He realized something that most people still haven't grasped: you don't need to code anymore. You don't need a team of fifty engineers. You don't need venture capital. You don't need permission. You just need to know what to build and how to describe it precisely. An anthropologist who spent a decade studying how systems actually work turned out to be the perfect person to command machines that build systems. The irony was biblical.",
      image: "./Old projects from archives/1773133828362.png",
      imageCaption: "The moment. Natural Language Coding. Not vibecoding. Building."
    },
    {
      number: "ACT III",
      title: "THE ARSENAL",
      body: "What followed was not normal. In months, not years, Non produced what entire agencies struggle to prototype: a Smart City Super Dashboard tracking sensors, transit, air quality, and EV loops across entire metropolitan zones. A GlobeWatch system monitoring satellite fires, military movements, market radar, and diplomatic sanctions in real time. A City Reporter Bot that processes thousands of civic tickets and surfaces the patterns. A city ranking algorithm that scored Bangkok at 84. A geopolitics monitor covering the Middle East. And this page you're reading right now. Every single one built by one person talking to AI.",
      image: "./Old projects from archives/Screenshot 2569-03-11 at 12.10.19.png",
      imageCaption: "Dr. Non's GlobeWatch System. One person. Global coverage."
    },
    {
      number: "ACT IV",
      title: "THE THESIS",
      body: "Here's the part that makes bureaucrats nervous: if one person can build what used to require an entire department, what exactly is the department for? If a city dashboard that would cost ten million baht in procurement can be spoken into existence in a weekend, what is money for? The old world charges for scarcity. Code was scarce. Engineers were scarce. Understanding what cities need was scarce. Now code is free. Engineers are optional. And understanding? That was always the bottleneck, and Non has a PhD in exactly that. The machines do the typing. The human does the thinking. Everything else is overhead.",
      image: "./Old projects from archives/1773570204010.jpg",
      imageCaption: "The Super Dashboard. Entire city intelligence layer. Built by speaking."
    },
    {
      number: "ACT V",
      title: "THE DEPLOYMENT",
      body: "This is not a portfolio. This is a proof of concept for a new economy. Every card on this page is a live system. Every green light is a server responding. Every endpoint is an API that works. The old game was: get funding, hire team, build slowly, launch quietly, maintain painfully. The new game is: understand the problem, describe the solution, deploy immediately, iterate in real time. Money doesn't buy speed anymore. Clarity does. And this entire wall — every monitor, every dashboard, every bot — is one person's clarity made operational. The future isn't expensive. It's articulate.",
      image: "./Old projects from archives/Screenshot 2569-03-11 at 15.04.33.png",
      imageCaption: "Render deployment log. Services spinning up. The machines obey."
    }
  ],
  coda: "120+ projects. 77 provinces. 5,000+ officials trained. 100+ global forums. One laptop. One voice. Zero permission asked."
};


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
  coverImage: "./Designated Survivor/ChatGPT Image Mar 7, 2026, 10_42_04 AM.png",
  coverFallback: "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7868b669-5217-4207-a393-43d582fc3628_2528x1696.png",
  latestChapter: "Chapter 3: The Bangkok Perimeter",
  latestDate: "Mar 2026",
  chapters: ["Chapter 1: Champagne Supernova", "Chapter 2: Protocols in the Mist", "Chapter 3: The Bangkok Perimeter"],
  gallery: [
    "./Designated Survivor/ChatGPT Image Feb 23, 2026, 05_51_48 AM.png",
    "./Designated Survivor/ChatGPT Image Feb 23, 2026, 05_51_58 AM.png",
    "./Designated Survivor/ChatGPT Image Feb 23, 2026, 06_06_25 AM.png",
    "./Designated Survivor/Gemini_Generated_Image_2y478l2y478l2y47.png",
    "./Designated Survivor/Gemini_Generated_Image_5lfeas5lfeas5lfe.png",
    "./Designated Survivor/Gemini_Generated_Image_6dse5e6dse5e6dse.png",
    "./Designated Survivor/Gemini_Generated_Image_hptkqrhptkqrhptk.png",
    "./Designated Survivor/Gemini_Generated_Image_kofnrnkofnrnkofn.png"
  ]
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
  },
  "slic-index-v2-vercel": {
    monogram: "SI"
  },
  "sabai-sabai": {
    monogram: "SS"
  },
  "axiom": {
    monogram: "AX"
  },
  "geopolitics-dashboard": {
    monogram: "GD"
  },
  "geopolitics-dashboard-vercel": {
    monogram: "GD"
  },
  "dngws-monitor": {
    monogram: "DN"
  },
  "phuket-dashboard-vercel": {
    monogram: "PD"
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
  refreshTimer: null,
  /* v4 — Time travel */
  timeTravel: false,
  timeTravelCommits: [],
  timeTravelCache: new Map(),
  timeTravelIndex: 0
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
  originStory: document.querySelector("#originStory"),
  copyBlueprintButton: document.querySelector("#copyBlueprintButton"),
  blueprintCode: document.querySelector("#blueprintCode"),
  /* v4 new elements */
  distributionCharts: document.querySelector("#distributionCharts"),
  timeTravelBar: document.querySelector("#timeTravelBar"),
  timeTravelSlider: document.querySelector("#timeTravelSlider"),
  timeTravelDate: document.querySelector("#timeTravelDate"),
  timeTravelLabel: document.querySelector("#timeTravelLabel"),
  timeTravelReturn: document.querySelector("#timeTravelReturn"),
  timeTravelToggle: document.querySelector("#timeTravelToggle"),
  alertBanner: document.querySelector("#alertBanner"),
  fleetUptime: document.querySelector("#fleetUptime"),
  visitorIntel: document.querySelector("#visitorIntel"),
  alertTimeline: document.querySelector("#alertTimeline"),
  triggerPanel: document.querySelector("#triggerPanel"),
  versionHistory: document.querySelector("#versionHistory")
};

/* ============================================================
   v5 — Tab Switching
   ============================================================ */

function switchTab(tabId) {
  document.querySelectorAll(".tab-panel").forEach((p) => { p.hidden = p.id !== "tab-" + tabId; });
  document.querySelectorAll(".tab[data-tab]").forEach((t) => {
    t.classList.toggle("tab--active", t.dataset.tab === tabId);
  });
  window.history.replaceState(null, "", "#" + tabId);
}

function initTabs() {
  for (const tab of document.querySelectorAll(".tab[data-tab]")) {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab(tab.dataset.tab);
    });
  }
  const hash = window.location.hash.replace("#", "");
  if (hash && document.getElementById("tab-" + hash)) {
    switchTab(hash);
  }
}

/* ============================================================
   v5 — Version History
   ============================================================ */

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(2) + " MB";
}

function renderBandwidth(bandwidth, targets) {
  const container = document.getElementById("bandwidthSummary");
  if (!container || !bandwidth) return;

  const byPlatform = bandwidth.byPlatform || [];
  const platformRows = byPlatform.map((p) => `
    <div class="bandwidth-platform-row">
      <span class="bandwidth-platform-name">${escapeHtml(p.platform)}</span>
      <span>${p.count} targets</span>
      <span>${formatBytes(p.bytes)}</span>
      <span>${p.avgMs}ms avg</span>
      <span>${p.errors ? '<span style="color:var(--danger)">' + p.errors + ' errors</span>' : '<span style="color:var(--success)">0 errors</span>'}</span>
    </div>
  `).join("");

  const targetRows = [...targets]
    .sort((a, b) => (b.bodyBytes || 0) - (a.bodyBytes || 0))
    .slice(0, 10)
    .map((t) => `
      <div class="bandwidth-target-row">
        <span>${escapeHtml(t.label)}</span>
        <span>${formatBytes(t.bodyBytes)}</span>
        <span>${t.responseTimeMs ?? "—"}ms</span>
        <span>${escapeHtml(t.contentEncoding || "none")}</span>
        <span>${escapeHtml(t.cacheStatus || "none")}</span>
      </div>
    `).join("");

  container.innerHTML = `
    <div class="bandwidth-stats">
      <div class="fleet-stat"><span class="fleet-stat-label">Total transferred</span><span class="fleet-stat-value">${formatBytes(bandwidth.totalBytes)}</span></div>
      <div class="fleet-stat"><span class="fleet-stat-label">Avg per target</span><span class="fleet-stat-value">${formatBytes(bandwidth.avgBytes)}</span></div>
      <div class="fleet-stat"><span class="fleet-stat-label">Cache hits</span><span class="fleet-stat-value">${bandwidth.cacheHits}/${bandwidth.cacheTotal}</span></div>
    </div>
    <div class="bandwidth-grid">
      <div class="bandwidth-section">
        <div class="section-label">By Platform</div>
        <div class="bandwidth-platform-header"><span>Platform</span><span>Targets</span><span>Bytes</span><span>Speed</span><span>Errors</span></div>
        ${platformRows}
      </div>
      <div class="bandwidth-section">
        <div class="section-label">By Target (top 10)</div>
        <div class="bandwidth-target-header"><span>Target</span><span>Size</span><span>Speed</span><span>Encoding</span><span>Cache</span></div>
        ${targetRows}
      </div>
    </div>
  `;
}

const VERSION_HISTORY = [
  {
    version: "v1",
    date: "2025-03",
    title: "Genesis",
    description: "The first dashboard. A static HTML page listing every project Dr. Non had deployed. Targets added one by one. No server, no API, no monitoring. Just a list and a link.",
    commits: ["Add Dr. Non operating systems dashboard", "Add ASCN smart cities network target", "Soften dashboard card geometry"],
    aesthetic: "Raw HTML"
  },
  {
    version: "v1.5",
    date: "2025-03",
    title: "Terminal Era",
    description: "Shifted to a monospace terminal aesthetic. Tightened the density three times in two days. Removed photos. Added cache busting. The page started to feel like a command line.",
    commits: ["Shift UI to terminal aesthetic", "Refine terminal layout density", "Tighten terminal layout further", "Remove photo sections"],
    aesthetic: "Terminal / Monospace"
  },
  {
    version: "v2",
    date: "2025-03",
    title: "The Matrix",
    description: "Full sci-fi overhaul. Named after the Nebuchadnezzar. Added the Origin Story with five acts and two portraits. Integrated 'Designated Survivor: Bangkok' — a novel written in parallel. Photo archives of every prototype ever built.",
    commits: ["Implement Nebuchadnezzar/Matrix aesthetic", "Integrate Designated Survivor: Bangkok novel", "Add Origin Story section with five-act narrative"],
    aesthetic: "Matrix / Cyberpunk"
  },
  {
    version: "v3",
    date: "2025-03",
    title: "Operations Command",
    description: "Architecture shift: snapshot-first static deployment. The dashboard could now run on Vercel or GitHub Pages without a server. Added Google News mention sweeps, publishing speed graphs, and GitHub integration. The page became an operations center.",
    commits: ["Ship operating systems v3", "Convert to snapshot-first static architecture", "Add mentions signal"],
    aesthetic: "Dark Operations"
  },
  {
    version: "v4",
    date: "2026-03",
    title: "Cyber Modernism",
    description: "Complete visual redesign. Glass-morphism, CRT scanlines, orbital animations. Built a monitoring platform from scratch: persistent health history, scheduled checks, visitor analytics, Supabase long-term database. Added SVG gauge library (arc gauges, donut charts, sparklines). Time travel through historical snapshots. Auto-debug triggers for Claude Code and VS Code. Red Dot Design Award polish: typography scale, spacing grid, accessibility. Tools fighting each other — Claude Code, Codex, Antigravity, VS Code — but the machines obeyed.",
    commits: ["Ship Operating Systems v4 — Cyber Modernism redesign", "Add monitoring platform: uptime graphs, analytics, alerting, auto-debug triggers, Supabase", "V4 visual overhaul: SVG gauges, donut charts, sparklines, time travel", "Red Dot polish: design system tokens, accessibility, visual noise reduction", "Add static screenshot previews for dashboard showcase cards"],
    aesthetic: "Cyber Modernism / Glass"
  },
  {
    version: "v5",
    date: "2026-04",
    title: "The Vignelli Edition",
    description: "Paradigm shift. Threw out every rounded corner, every shadow, every gradient. Tab-based navigation replaced the infinite scroll. Dieter Rams meets the 1972 NYC subway map. IBM Plex Mono as the primary typeface. Color means information — nothing else. The structure IS the design. Built to survive a Red Dot jury.",
    commits: ["V5 — The Vignelli Edition"],
    aesthetic: "Vignelli / Swiss Industrial"
  }
];

function renderVersionHistory() {
  if (!elements.versionHistory) return;

  elements.versionHistory.innerHTML = VERSION_HISTORY.map((v) => `
    <div class="version-entry">
      <div class="version-number">${escapeHtml(v.version)}</div>
      <div class="version-meta">
        <span class="version-date">${escapeHtml(v.date)}</span>
        <span class="version-aesthetic">${escapeHtml(v.aesthetic)}</span>
      </div>
      <div class="version-body">
        <h3 class="version-title">${escapeHtml(v.title)}</h3>
        <p class="version-description">${escapeHtml(v.description)}</p>
        <div class="version-commits">
          ${v.commits.map((c) => '<span class="version-commit">' + escapeHtml(c) + '</span>').join("")}
        </div>
      </div>
    </div>
  `).join("");
}



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
  elements.mentionsRefreshButton.textContent = liveMode ? "Refresh mentions" : "Reload mention snapshot";
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
  if (elements.opsInventory) elements.opsInventory.hidden = !liveMode;
  if (elements.localLayout) elements.localLayout.hidden = !liveMode;

  const navStatus = document.querySelector("#navStatus");
  if (navStatus) {
    navStatus.innerHTML = makeStatusPill(liveMode ? "live" : "snapshot", liveMode ? "live" : "neutral");
  }

  const navOpsLink = document.querySelector("#navOpsLink");
  if (navOpsLink) {
    navOpsLink.hidden = !liveMode;
  }
}

function updateClock() {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  elements.clock.textContent = time;
  const navClock = document.querySelector("#navClock");
  if (navClock) {
    navClock.textContent = time;
  }
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
  const healthPct = summary.monitoredPages > 0 ? (summary.liveCount / summary.monitoredPages) * 100 : 0;
  const uptimePct = summary.fleetUptime24h ?? 0;
  const responseCapped = Math.min(summary.medianResponseMs || 0, 2000);

  elements.metricsGrid.innerHTML = `
    <article class="metric-card metric-card--gauge">
      ${SVG.arcGauge(summary.liveCount, summary.monitoredPages, 110, { label: "Health", displayValue: `${summary.liveCount}/${summary.monitoredPages}`, color: healthPct >= 90 ? "var(--success)" : healthPct >= 50 ? "var(--warning)" : "var(--danger)" })}
      <div class="metric-detail">
        <p class="metric-label">System Health</p>
        <div class="metric-subtext">${escapeHtml(formatNumber(summary.attentionCount))} need attention</div>
      </div>
    </article>
    <article class="metric-card metric-card--gauge">
      ${SVG.arcGauge(uptimePct, 100, 110, { label: "24h", displayValue: uptimePct ? uptimePct.toFixed(1) + "%" : "—", color: uptimePct >= 95 ? "var(--success)" : uptimePct >= 80 ? "var(--warning)" : "var(--danger)" })}
      <div class="metric-detail">
        <p class="metric-label">Fleet Uptime</p>
        <div class="metric-subtext">Average across all targets</div>
      </div>
    </article>
    <article class="metric-card metric-card--gauge">
      ${SVG.arcGauge(summary.apiCount, 200, 110, { label: "APIs", displayValue: String(summary.apiCount), color: "var(--accent)" })}
      <div class="metric-detail">
        <p class="metric-label">Mapped APIs</p>
        <div class="metric-subtext">${escapeHtml(formatNumber(summary.appsWithApis))} apps with endpoints</div>
      </div>
    </article>
    <article class="metric-card metric-card--gauge">
      ${SVG.arcGauge(2000 - responseCapped, 2000, 110, { label: "Speed", displayValue: (summary.medianResponseMs || 0) + "ms", color: responseCapped < 500 ? "var(--success)" : responseCapped < 1000 ? "var(--warning)" : "var(--danger)" })}
      <div class="metric-detail">
        <p class="metric-label">Median Response</p>
        <div class="metric-subtext">${summary.fastest ? `Fastest: ${escapeHtml(summary.fastest.label)}` : "No data"}</div>
      </div>
    </article>
  `;
}

const PLATFORM_COLORS = { Render: "var(--accent)", Web: "var(--accent-warm)", "GitHub Pages": "var(--accent-green)", Lovable: "var(--warning)", Local: "var(--muted-strong)" };
const LANG_COLORS = { JavaScript: "#f0db4f", TypeScript: "#3178c6", HTML: "#e34c26", CSS: "#563d7c", Python: "#3572A5", Shell: "#89e051" };

function renderDistributionCharts(summary, github) {
  const container = elements.distributionCharts;
  if (!container) return;

  const platformSegs = (summary.platformBreakdown || []).map((p) => ({
    label: p.platform, value: p.count, color: PLATFORM_COLORS[p.platform] || "var(--muted)"
  }));

  const langSegs = (github?.stats?.topLanguages || []).map((l) => ({
    label: l.name, value: l.count, color: LANG_COLORS[l.name] || "var(--muted-strong)"
  }));

  container.innerHTML = `
    <article class="panel distribution-card">
      <div class="panel-head"><p class="panel-kicker">Infrastructure</p><h2>Platform Mix</h2></div>
      ${SVG.donut(platformSegs, 150, { centerLabel: String(summary.monitoredPages) })}
    </article>
    <article class="panel distribution-card">
      <div class="panel-head"><p class="panel-kicker">Codebase</p><h2>Languages</h2></div>
      ${SVG.donut(langSegs, 150, { centerLabel: String(github?.profile?.publicRepos || 0) })}
    </article>
    <article class="panel distribution-card">
      <div class="panel-head"><p class="panel-kicker">Fleet status</p><h2>Health Split</h2></div>
      ${SVG.stackedBar([
        { label: "Live", value: summary.liveCount || 0, color: "var(--success)" },
        { label: "Degraded", value: (summary.attentionCount || 0), color: "var(--warning)" }
      ], 280, 16)}
      <div class="health-split-labels">
        <span style="color:var(--success)">${summary.liveCount || 0} live</span>
        <span style="color:var(--warning)">${summary.attentionCount || 0} attention</span>
      </div>
    </article>
  `;
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
  if (elements.mentionsSearchLink) elements.mentionsSearchLink.hidden = !mentions?.searchUrl;

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

  const activityPct = github.profile.publicRepos > 0 ? (github.stats.activeLast30d / github.profile.publicRepos) * 100 : 0;
  const langSegs = (github.stats.topLanguages || []).map((l) => ({
    label: l.name, value: l.count, color: LANG_COLORS[l.name] || "var(--muted-strong)"
  }));

  elements.githubSummary.innerHTML = `
    <div class="github-visual">
      <div class="github-visual-gauges">
        ${SVG.arcGauge(github.stats.activeLast30d, github.profile.publicRepos, 56, { label: "Active", displayValue: String(github.stats.activeLast30d) })}
        ${SVG.miniRing(activityPct, 28)}
      </div>
      <div class="github-visual-stats">
        ${makeStatusPill(github.profile.login, "live")}
        <span class="terminal-inline">${escapeHtml(formatNumber(github.profile.publicRepos))} repos</span>
        <span class="terminal-inline">${escapeHtml(formatNumber(github.stats.githubPagesRepos))} Pages</span>
        <span class="terminal-inline">Updated ${escapeHtml(formatDate(github.profile.updatedAt))}</span>
      </div>
      <div class="github-visual-langs">
        ${SVG.stackedBar(langSegs, 180, 10)}
      </div>
      <a class="action-link" href="${escapeHtml(github.profile.url)}" rel="noreferrer" target="_blank">Open GitHub</a>
    </div>
  `;
}

function renderIssues(summary) {
  if (!summary.issues.length) {
    elements.issuePanel.hidden = true;
    if (elements.signalGrid) elements.signalGrid.hidden = elements.githubPanel.hidden;
    return;
  }

  elements.issuePanel.hidden = false;
  if (elements.signalGrid) elements.signalGrid.hidden = false;
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

function buildPreviewShell(target) {
  const httpLabel = target.statusCode ? "HTTP " + target.statusCode : "No HTTP code";

  if (target.screenshot) {
    return '<div class="preview-shell preview-shell--screenshot"'
      + ' aria-label="Open ' + escapeHtml(target.label) + ' live site"'
      + ' data-open-url="' + escapeHtml(target.url) + '"'
      + ' role="link" tabindex="0">'
      + '<div class="preview-bar">'
      + '<div class="preview-signal">' + makeStatusPill(target.health.label, target.health.code) + '</div>'
      + '<div class="preview-http">' + makeStatusPill(httpLabel, target.health.code) + '</div>'
      + '</div>'
      + '<img class="preview-screenshot" src="' + escapeHtml(target.screenshot)
      + '" alt="' + escapeHtml(target.label) + ' dashboard screenshot" loading="lazy" />'
      + '<div class="preview-fade"></div>'
      + '</div>';
  }

  return '<div class="preview-shell"'
    + ' aria-label="Open ' + escapeHtml(target.label) + ' live site"'
    + ' data-open-url="' + escapeHtml(target.url) + '"'
    + ' role="link"'
    + ' style="--preview-width: ' + PREVIEW_VIEWPORT.width + '; --preview-height: ' + PREVIEW_VIEWPORT.height + ';"'
    + ' tabindex="0">'
    + '<div class="preview-bar">'
    + '<div class="preview-signal">' + makeStatusPill("Preview loading", "loading") + '</div>'
    + '<div class="preview-http">' + makeStatusPill(httpLabel, target.health.code) + '</div>'
    + '</div>'
    + '<iframe loading="lazy" referrerpolicy="no-referrer" src="' + escapeHtml(target.url)
    + '" title="' + escapeHtml(target.label) + ' preview"></iframe>'
    + '<div class="preview-fade"></div>'
    + '</div>';
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
    ["Last modified", target.metadata ? formatDate(target.metadata.lastModified) : "n/a"],
    ["Server", target.metadata ? (target.metadata.server || target.metadata.xPoweredBy || "n/a") : "n/a"],
    ["Final host", target.hostname || "n/a"]
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

      ${buildPreviewShell(target)}

      <div class="history">
        <div class="history-visual">
          <div class="history-sparkline">
            <p class="eyebrow">Response time</p>
            ${SVG.sparkline((target.historyBuckets || []).map((b) => b.avgMs || 0), 140, 28)}
          </div>
          <div class="history-uptime-ring">
            <p class="eyebrow">24h up</p>
            ${SVG.miniRing(target.uptime?.h24, 28)}
          </div>
        </div>
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

function renderFieldRecord() {
  const container = document.querySelector("#fieldRecord");
  if (!container) return;

  const statsHtml = `
    <div class="field-stats-bar">
      ${FIELD_RECORD.stats.map((s) => {
        const numMatch = s.value.match(/^(\d[\d,]*)(.*)/);
        if (numMatch) {
          const num = parseInt(numMatch[1].replace(/,/g, ""), 10);
          const suffix = numMatch[2];
          return `
            <div class="field-stat-item">
              <span class="field-stat-value" data-target="${num}" data-suffix="${escapeHtml(suffix)}">0${escapeHtml(suffix)}</span>
              <span class="field-stat-label">${escapeHtml(s.label)}</span>
            </div>`;
        }
        return `
          <div class="field-stat-item">
            <span class="field-stat-value">${escapeHtml(s.value)}</span>
            <span class="field-stat-label">${escapeHtml(s.label)}</span>
          </div>`;
      }).join("")}
    </div>`;

  const photosHtml = `
    <div class="field-photo-grid">
      ${FIELD_PHOTOS.map((photo, idx) => `
        <div class="field-photo-card" data-index="${idx}" data-caption="${escapeHtml(photo.caption)}" data-location="${escapeHtml(photo.location)}">
          <img
            class="field-photo-img"
            src="./Development History/${encodeURIComponent(photo.file)}"
            alt="${escapeHtml(photo.caption)}"
            loading="lazy"
            onerror="this.closest('.field-photo-card').style.display='none'"
          />
          <div class="field-photo-caption-overlay">
            <span class="field-photo-caption-text">${escapeHtml(photo.caption)}</span>
            <span class="field-photo-caption-loc">${escapeHtml(photo.location)}</span>
          </div>
        </div>
      `).join("")}
    </div>`;

  const actsHtml = `
    <div class="field-acts">
      ${FIELD_RECORD.acts.map((act) => `
        <div class="field-act">
          <span class="field-act-number">${escapeHtml(act.number)}</span>
          <h3 class="field-act-title">${escapeHtml(act.title)}</h3>
          <p class="field-act-body">${escapeHtml(act.body)}</p>
        </div>
      `).join("")}
    </div>`;

  container.innerHTML = statsHtml + photosHtml + actsHtml;
  initCountUp();
}

function renderHistoryGallery() {
  if (!elements.historyGallery) return;

  elements.historyGallery.innerHTML = ARCHIVE_IMAGES.map((item) => `
    <article class="history-card${item.tag === "live" ? " history-card--live" : ""}">
      <div class="history-mark">
        <img
          class="history-image"
          alt="${escapeHtml(item.label)}"
          loading="lazy"
          src="./Old projects from archives/${encodeURIComponent(item.file)}"
          onerror="this.closest('.history-card').style.display='none'"
        />
      </div>
      <div class="history-info">
        <span class="history-tag history-tag--${escapeHtml(item.tag)}">${escapeHtml(item.tag)}</span>
        <span class="history-filename">${escapeHtml(item.label)}</span>
      </div>
    </article>
  `).join("");
}

function renderOriginStory() {
  if (!elements.originStory) return;

  const actsHTML = ORIGIN_STORY.acts.map((act, i) => {
    const isEven = i % 2 === 1;
    return `
      <article class="origin-act ${isEven ? "origin-act-reverse" : ""}">
        <div class="origin-act-image-wrap">
          <img
            class="origin-act-image"
            src="${escapeHtml(act.image)}"
            alt="${escapeHtml(act.imageCaption)}"
            loading="lazy"
          />
          <span class="origin-act-caption">${escapeHtml(act.imageCaption)}</span>
        </div>
        <div class="origin-act-text">
          <div class="origin-act-number">${escapeHtml(act.number)}</div>
          <h3 class="origin-act-title">${escapeHtml(act.title)}</h3>
          <p class="origin-act-body">${escapeHtml(act.body)}</p>
        </div>
      </article>
    `;
  }).join("");

  const portraitHTML = `
    <div class="origin-hero">
      <div class="origin-portraits">
        <div class="origin-portrait-wrap">
          <img class="origin-portrait" src="${escapeHtml(ORIGIN_STORY.portrait.operator)}" alt="The operator" loading="lazy" />
          <span class="origin-portrait-label">THE OPERATOR</span>
        </div>
        <div class="origin-portrait-wrap">
          <img class="origin-portrait" src="${escapeHtml(ORIGIN_STORY.portrait.formal)}" alt="The credential" loading="lazy" />
          <span class="origin-portrait-label">THE CREDENTIAL</span>
        </div>
      </div>
      <div class="origin-hero-text">
        <p class="origin-subtitle">${escapeHtml(ORIGIN_STORY.subtitle)}</p>
      </div>
    </div>
  `;

  elements.originStory.innerHTML = `
    ${portraitHTML}
    <div class="origin-timeline">
      <div class="origin-timeline-line"></div>
      ${actsHTML}
    </div>
    <div class="origin-coda">
      <p class="origin-coda-text">${escapeHtml(ORIGIN_STORY.coda)}</p>
    </div>
  `;
}

/* ============================================================
   Phase 1 — Fleet Uptime Heatmap (GitHub-style)
   ============================================================ */

function uptimeColor(ups, checks) {
  if (!checks) return "var(--bg-card)";
  const pct = ups / checks;
  if (pct >= 1) return "rgba(0, 212, 154, 0.82)";
  if (pct >= 0.9) return "rgba(0, 212, 154, 0.55)";
  if (pct >= 0.5) return "rgba(255, 170, 26, 0.7)";
  return "rgba(255, 45, 94, 0.7)";
}

function uptimeShape(ups, checks) {
  if (!checks) return "";
  const pct = ups / checks;
  if (pct >= 1) return "";
  if (pct >= 0.5) return "heatmap-cell--warn";
  return "heatmap-cell--down";
}

function uptimePctClass(pct) {
  if (pct === null || pct === undefined) return "uptime-pct--none";
  if (pct >= 99) return "uptime-pct--great";
  if (pct >= 90) return "uptime-pct--good";
  if (pct >= 50) return "uptime-pct--warn";
  return "uptime-pct--bad";
}

function renderUptimeHeatmap(buckets, hours = 168) {
  if (!buckets || !buckets.length) {
    return '<div class="uptime-empty">No history data yet</div>';
  }

  const bucketMap = new Map(buckets.map((b) => [b.hour, b]));
  const now = new Date();
  const cells = [];

  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600_000);
    const key = d.toISOString().slice(0, 13);
    const b = bucketMap.get(key);
    const bg = b ? uptimeColor(b.ups, b.checks) : "var(--bg-card)";
    const pct = b && b.checks ? Math.round((b.ups / b.checks) * 100) : null;
    const avgMs = b && b.checks ? Math.round(b.totalMs / b.checks) : null;
    const avg = b ? (b.avgMs != null ? b.avgMs : avgMs) : null;
    const title = b
      ? `${key}:00 — ${pct}% up, ${avg ?? "?"}ms avg (${b.checks} checks)`
      : `${key}:00 — no data`;

    const shape = b ? uptimeShape(b.ups, b.checks) : "";
    cells.push(`<span class="heatmap-cell ${shape}" style="background:${bg}" title="${escapeHtml(title)}"></span>`);
  }

  const cols = Math.min(hours, 168);
  const rows = Math.ceil(hours / 24);

  return `<div class="heatmap-grid" style="grid-template-columns:repeat(${Math.min(cols, 24)},1fr)">${cells.join("")}</div>`;
}

function renderFleetUptime(targets) {
  const container = elements.fleetUptime;
  if (!container) return;

  const sorted = [...targets].sort((a, b) => {
    const aUp = a.uptime?.h24 ?? 101;
    const bUp = b.uptime?.h24 ?? 101;
    return aUp - bUp;
  });

  const fleetBuckets = [];
  const now = new Date();

  for (let i = 167; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600_000);
    const key = d.toISOString().slice(0, 13);
    let totalChecks = 0;
    let totalUps = 0;

    for (const t of targets) {
      const b = (t.historyBuckets || []).find((b) => b.hour === key);
      if (b) {
        totalChecks += b.checks;
        totalUps += b.ups;
      }
    }

    fleetBuckets.push({ hour: key, checks: totalChecks, ups: totalUps });
  }

  const summaryUps = targets.map((t) => t.uptime);
  const avg24 = summaryUps.filter((u) => u?.h24 != null).length
    ? Math.round(summaryUps.reduce((s, u) => s + (u?.h24 ?? 0), 0) / summaryUps.filter((u) => u?.h24 != null).length * 100) / 100
    : null;
  const avg7d = summaryUps.filter((u) => u?.d7 != null).length
    ? Math.round(summaryUps.reduce((s, u) => s + (u?.d7 ?? 0), 0) / summaryUps.filter((u) => u?.d7 != null).length * 100) / 100
    : null;
  const avg30d = summaryUps.filter((u) => u?.d30 != null).length
    ? Math.round(summaryUps.reduce((s, u) => s + (u?.d30 ?? 0), 0) / summaryUps.filter((u) => u?.d30 != null).length * 100) / 100
    : null;

  container.innerHTML = `
    <div class="fleet-summary-bar">
      <div class="fleet-stat fleet-stat--gauge">
        ${SVG.arcGauge(avg24 ?? 0, 100, 64, { label: "24h", displayValue: avg24 != null ? avg24.toFixed(1) + "%" : "—" })}
      </div>
      <div class="fleet-stat fleet-stat--gauge">
        ${SVG.arcGauge(avg7d ?? 0, 100, 64, { label: "7d", displayValue: avg7d != null ? avg7d.toFixed(1) + "%" : "—" })}
      </div>
      <div class="fleet-stat fleet-stat--gauge">
        ${SVG.arcGauge(avg30d ?? 0, 100, 64, { label: "30d", displayValue: avg30d != null ? avg30d.toFixed(1) + "%" : "—" })}
      </div>
    </div>
    <div class="fleet-heatmap-section">
      <p class="eyebrow">Fleet-wide (7 days)</p>
      ${renderUptimeHeatmap(fleetBuckets, 168)}
    </div>
    <div class="fleet-target-rows">
      ${sorted.map((t) => {
        const u = t.uptime || {};
        return `
          <div class="fleet-row" data-health="${escapeHtml(t.health?.code || "offline")}">
            <span class="fleet-row-name">${escapeHtml(t.label)}</span>
            <span class="fleet-row-status">${makeStatusPill(t.health?.label || "Unknown", t.health?.code || "offline")}</span>
            <div class="fleet-row-heatmap">${renderUptimeHeatmap(t.historyBuckets || [], 168)}</div>
            <span class="fleet-row-ring" title="24h: ${u.h24 != null ? u.h24 + "%" : "—"}">${SVG.miniRing(u.h24, 22)}</span>
            <span class="fleet-row-ring" title="7d: ${u.d7 != null ? u.d7 + "%" : "—"}">${SVG.miniRing(u.d7, 22)}</span>
            <span class="fleet-row-ring" title="30d: ${u.d30 != null ? u.d30 + "%" : "—"}">${SVG.miniRing(u.d30, 22)}</span>
          </div>`;
      }).join("")}
    </div>
  `;
}

/* ============================================================
   Phase 3 — Visitor Intelligence
   ============================================================ */

function renderVisitorIntel(analytics) {
  const container = elements.visitorIntel;
  if (!container || !analytics) return;

  const fleet = analytics.fleet || {};
  const countries = fleet.countries || [];
  const maxCount = countries[0]?.count || 1;

  const countryBars = countries.length
    ? countries.map((c) => {
        const width = Math.max(4, Math.round((c.count / maxCount) * 100));
        return `
          <div class="country-row">
            <span class="country-name">${escapeHtml(c.country)}</span>
            <div class="country-bar-track">
              <div class="country-bar-fill" style="width:${width}%"></div>
            </div>
            <span class="country-count">${c.count}</span>
          </div>`;
      }).join("")
    : '<div class="uptime-empty">No visitor data yet</div>';

  const projectRows = Object.entries(analytics.projects || {})
    .sort((a, b) => (b[1].week || 0) - (a[1].week || 0))
    .slice(0, 15)
    .map(([id, p]) => `
      <div class="visitor-project-row">
        <span class="visitor-project-name">${escapeHtml(id)}</span>
        <span class="visitor-project-today">${p.today || 0}</span>
        <span class="visitor-project-week">${p.week || 0}</span>
        <span class="visitor-project-unique">${p.todayUnique || 0}</span>
        <span class="visitor-project-ms">${p.avgMs != null ? p.avgMs + "ms" : "—"}</span>
      </div>
    `)
    .join("");

  container.innerHTML = `
    <div class="visitor-summary-bar">
      <div class="fleet-stat">
        <span class="fleet-stat-label">Today</span>
        <span class="fleet-stat-value">${fleet.todayVisitors || 0}</span>
      </div>
      <div class="fleet-stat">
        <span class="fleet-stat-label">7-day total</span>
        <span class="fleet-stat-value">${fleet.weekVisitors || 0}</span>
      </div>
    </div>
    <div class="visitor-grid">
      <div class="visitor-countries">
        <p class="eyebrow">Top countries (7d)</p>
        ${countryBars}
      </div>
      <div class="visitor-projects">
        <p class="eyebrow">Traffic by project</p>
        <div class="visitor-project-header">
          <span>Project</span><span>Today</span><span>7d</span><span>Unique</span><span>Avg ms</span>
        </div>
        ${projectRows || '<div class="uptime-empty">No project data yet</div>'}
      </div>
    </div>
  `;
}

/* ============================================================
   Phase 4 — Alert Banner & Timeline
   ============================================================ */

function renderAlertBanner(alerts) {
  const banner = elements.alertBanner;
  if (!banner) return;

  const active = alerts?.active || [];

  if (!active.length) {
    banner.hidden = true;
    return;
  }

  banner.hidden = false;
  banner.innerHTML = `
    <div class="alert-banner-inner">
      <span class="alert-banner-icon">&#9888;</span>
      <span class="alert-banner-text">
        <strong>${active.length} active incident${active.length > 1 ? "s" : ""}</strong>:
        ${active.slice(0, 3).map((a) => escapeHtml(a.targetLabel)).join(", ")}${active.length > 3 ? ` +${active.length - 3} more` : ""}
      </span>
    </div>
  `;
}

function alertSeverityClass(severity) {
  if (severity === "critical") return "alert-severity--critical";
  if (severity === "warning") return "alert-severity--warning";
  return "alert-severity--info";
}

function renderAlertTimeline(alerts) {
  const container = elements.alertTimeline;
  if (!container) return;

  const recent = alerts?.recent || [];

  if (!recent.length) {
    container.innerHTML = '<div class="uptime-empty">No alerts recorded yet. Alerts fire when systems change health state.</div>';
    return;
  }

  const critCount = recent.filter((a) => a.severity === "critical").length;
  const warnCount = recent.filter((a) => a.severity === "warning").length;
  const infoCount = recent.filter((a) => a.severity === "info").length;

  const severityHeader = `
    <div class="alert-severity-header">
      <div class="severity-ring-group">
        ${SVG.miniRing(critCount > 0 ? 100 : 0, 18, { color: "var(--danger)" })}<span class="severity-ring-label">${critCount} critical</span>
        ${SVG.miniRing(warnCount > 0 ? 100 : 0, 18, { color: "var(--warning)" })}<span class="severity-ring-label">${warnCount} warning</span>
        ${SVG.miniRing(infoCount > 0 ? 100 : 0, 18, { color: "var(--success)" })}<span class="severity-ring-label">${infoCount} recovery</span>
      </div>
    </div>`;

  container.innerHTML = severityHeader + recent.map((a) => `
    <div class="alert-row ${alertSeverityClass(a.severity)}${a.resolvedAt ? " alert-resolved" : ""}">
      <span class="alert-time">${escapeHtml(shortTime(a.timestamp))}</span>
      <span class="alert-severity-badge">${escapeHtml(a.severity)}</span>
      <span class="alert-type-badge">${escapeHtml(a.type)}</span>
      <span class="alert-message">${escapeHtml(a.message)}</span>
      ${a.resolvedAt ? `<span class="alert-resolved-badge">Resolved ${escapeHtml(shortTime(a.resolvedAt))}</span>` : ""}
    </div>
  `).join("");
}

/* ============================================================
   Phase 5 — Debug Triggers Panel
   ============================================================ */

function triggerStatusClass(status) {
  if (status === "open") return "trigger-status--open";
  if (status === "claimed") return "trigger-status--claimed";
  return "trigger-status--resolved";
}

function renderTriggerPanel(triggers) {
  const container = elements.triggerPanel;
  if (!container) return;

  const items = triggers || [];

  if (!items.length) {
    container.innerHTML = '<div class="uptime-empty">No active triggers. Triggers are created when critical systems stay down for 5+ minutes.</div>';
    return;
  }

  container.innerHTML = items.map((t) => `
    <article class="trigger-card ${triggerStatusClass(t.status)}">
      <div class="trigger-header">
        <span class="trigger-target">${escapeHtml(t.targetLabel)}</span>
        <span class="trigger-status-badge">${escapeHtml(t.status)}</span>
        <span class="trigger-time">${escapeHtml(shortTime(t.createdAt))}</span>
      </div>
      <div class="trigger-context">
        <div class="trigger-detail"><span>URL</span><code>${escapeHtml(t.context?.url || "—")}</code></div>
        <div class="trigger-detail"><span>Error</span><code>${escapeHtml(t.context?.error || "—")}</code></div>
        <div class="trigger-detail"><span>Platform</span><code>${escapeHtml(t.context?.platform || "—")}</code></div>
        <div class="trigger-detail"><span>Down since</span><code>${escapeHtml(t.context?.downtimeSince ? shortTime(t.context.downtimeSince) : "—")}</code></div>
        ${t.claimedBy ? `<div class="trigger-detail"><span>Claimed by</span><code>${escapeHtml(t.claimedBy)}</code></div>` : ""}
      </div>
      ${t.context?.suggestedActions?.length ? `
        <div class="trigger-actions">
          <p class="eyebrow">Suggested actions</p>
          <ul>${t.context.suggestedActions.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
        </div>
      ` : ""}
      <div class="trigger-api-ref">
        <code>POST /api/triggers/${escapeHtml(t.id)}/claim</code>
        <code>POST /api/triggers/${escapeHtml(t.id)}/resolve</code>
      </div>
    </article>
  `).join("");
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

  const { generatedAt, github, mentions, summary, targets, analytics, alerts, triggers, bandwidth } = state.dashboard;
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
  renderDistributionCharts(summary, github);
  renderBandwidth(bandwidth, targets);
  renderFleetUptime(targets);
  renderVisitorIntel(analytics);
  renderAlertBanner(alerts);
  renderAlertTimeline(alerts);
  renderTriggerPanel(triggers);
  renderMentions(state.mentions);
  renderGitHub(github);
  renderIssues(summary);
  renderApiInventory(targets, summary);
  renderRecentProjects(targets);
  renderPublishingSpeed(targets);
  renderApiRegistry();
  renderRemoteSections(targets);

  if (state.timeTravel) {
    elements.lastChecked.textContent = `Historical snapshot from ${formatDate(generatedAt)}`;
    elements.dashboardState.className = "status-pill status-pill-degraded";
    elements.dashboardState.textContent = `Time travel • ${summary.liveCount}/${summary.monitoredPages} were healthy`;
  } else {
    elements.lastChecked.textContent = snapshotBacked
      ? `Snapshot updated ${formatDate(generatedAt)}`
      : `Last live scan ${formatDate(generatedAt)}`;
    elements.dashboardState.className = snapshotBacked
      ? "status-pill status-pill-neutral"
      : "status-pill status-pill-live";
    elements.dashboardState.textContent = snapshotBacked
      ? `Snapshot • ${summary.liveCount}/${summary.monitoredPages} public pages healthy`
      : `${summary.liveCount}/${summary.monitoredPages} public pages healthy`;
  }
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

async function fetchSnapshotMentions(force = false) {
  const snapshot = await fetchSnapshotDashboard(force);

  return snapshot.mentions ?? {
    checkedAt: snapshot.generatedAt ?? null,
    error: "Mention snapshot unavailable.",
    items: [],
    latestAt: null,
    scannedAliases: [],
    searchUrl: "https://news.google.com/",
    source: "Mention sweep",
    status: "offline"
  };
}

async function fetchMentions(force = false) {
  if (state.mode !== "live") {
    return fetchSnapshotMentions(force);
  }

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

function initLightbox() {
  const overlay = document.createElement("div");
  overlay.id = "lb";
  overlay.className = "lb-overlay";
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("role", "dialog");
  overlay.style.display = "none";
  overlay.innerHTML = [
    '<button class="lb-close" aria-label="Close">&times;</button>',
    '<button class="lb-prev" aria-label="Previous">&#8249;</button>',
    '<button class="lb-next" aria-label="Next">&#8250;</button>',
    '<div class="lb-content">',
    '  <img class="lb-img" src="" alt="" />',
    '  <div class="lb-caption">',
    '    <span class="lb-caption-text"></span>',
    '    <span class="lb-caption-loc"></span>',
    '  </div>',
    '</div>'
  ].join("");
  document.body.appendChild(overlay);

  let current = 0;

  function visibleCards() {
    return [...document.querySelectorAll(".field-photo-card")].filter(
      (c) => c.style.display !== "none"
    );
  }

  function openAt(idx) {
    const cards = visibleCards();
    if (!cards.length) return;
    current = ((idx % cards.length) + cards.length) % cards.length;
    const card = cards[current];
    const img = card.querySelector(".field-photo-img");
    const caption = card.dataset.caption || "";
    const location = card.dataset.location || "";
    overlay.querySelector(".lb-img").src = img ? img.src : "";
    overlay.querySelector(".lb-img").alt = caption;
    overlay.querySelector(".lb-caption-text").textContent = caption;
    overlay.querySelector(".lb-caption-loc").textContent = location;
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeLb() {
    overlay.style.display = "none";
    document.body.style.overflow = "";
  }

  overlay.querySelector(".lb-close").addEventListener("click", closeLb);
  overlay.querySelector(".lb-prev").addEventListener("click", () => openAt(current - 1));
  overlay.querySelector(".lb-next").addEventListener("click", () => openAt(current + 1));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeLb(); });

  document.addEventListener("keydown", (e) => {
    if (overlay.style.display === "none") return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") openAt(current - 1);
    if (e.key === "ArrowRight") openAt(current + 1);
  });

  document.addEventListener("click", (e) => {
    const card = e.target.closest(".field-photo-card");
    if (!card) return;
    const idx = visibleCards().indexOf(card);
    if (idx !== -1) openAt(idx);
  });
}

function initCountUp() {
  const targets = document.querySelectorAll(".field-stat-value[data-target]");
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || "";
      const duration = 1400;
      const t0 = performance.now();

      function tick(now) {
        const p = Math.min((now - t0) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(ease * target).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.4 });

  targets.forEach((el) => observer.observe(el));
}

/* ============================================================
   v4 — Time Travel
   ============================================================ */

async function openTimeTravel() {
  if (!elements.timeTravelBar) return;

  elements.timeTravelLabel.textContent = "Loading snapshots...";
  elements.timeTravelBar.hidden = false;

  try {
    let commits;
    if (state.mode === "live") {
      const resp = await fetch("./api/snapshots", { cache: "no-store" });
      commits = resp.ok ? await resp.json() : [];
    } else {
      commits = [];
    }

    if (!commits.length) {
      elements.timeTravelLabel.textContent = "No snapshots available";
      return;
    }

    state.timeTravelCommits = commits;
    elements.timeTravelSlider.max = String(commits.length - 1);
    elements.timeTravelSlider.value = "0";
    state.timeTravelIndex = 0;
    updateTimeTravelDate(0);
    elements.timeTravelLabel.textContent = `${commits.length} snapshots available`;
  } catch (error) {
    elements.timeTravelLabel.textContent = "Could not load snapshot history";
  }
}

function updateTimeTravelDate(index) {
  const commit = state.timeTravelCommits[index];
  if (!commit) return;
  elements.timeTravelDate.textContent = formatDate(commit.date);
}

async function loadHistoricalSnapshot(index) {
  const commit = state.timeTravelCommits[index];
  if (!commit) return;

  state.timeTravelIndex = index;
  updateTimeTravelDate(index);

  if (state.timeTravelCache.has(commit.sha)) {
    state.dashboard = state.timeTravelCache.get(commit.sha);
    state.timeTravel = true;
    state.lastLoadSource = "time-travel";
    renderDashboard();
    return;
  }

  elements.timeTravelLabel.textContent = "Loading snapshot...";

  try {
    let data;
    if (state.mode === "live") {
      const resp = await fetch(`./api/snapshots/${commit.sha}`, { cache: "no-store" });
      data = resp.ok ? await resp.json() : null;
    } else {
      const resp = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/${commit.sha}/${SNAPSHOT_COMMITS_PATH}`);
      data = resp.ok ? await resp.json() : null;
    }

    if (!data) {
      elements.timeTravelLabel.textContent = "Could not load this snapshot";
      return;
    }

    state.timeTravelCache.set(commit.sha, data);
    state.dashboard = data;
    state.timeTravel = true;
    state.lastLoadSource = "time-travel";
    elements.timeTravelLabel.textContent = `Viewing: ${formatDate(commit.date)}`;
    renderDashboard();
  } catch (error) {
    elements.timeTravelLabel.textContent = "Snapshot load failed";
  }
}

function closeTimeTravel() {
  state.timeTravel = false;
  elements.timeTravelBar.hidden = true;
  refreshDashboard(true);
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

  /* v4 — Time travel bindings */
  if (elements.timeTravelToggle) {
    elements.timeTravelToggle.addEventListener("click", openTimeTravel);
  }
  if (elements.timeTravelSlider) {
    elements.timeTravelSlider.addEventListener("input", (e) => {
      updateTimeTravelDate(Number(e.target.value));
    });
    elements.timeTravelSlider.addEventListener("change", (e) => {
      loadHistoricalSnapshot(Number(e.target.value));
    });
  }
  if (elements.timeTravelReturn) {
    elements.timeTravelReturn.addEventListener("click", closeTimeTravel);
  }
}


function renderNovelSection() {
  const container = document.querySelector("#novelContent");
  if (!container) return;

  const galleryHtml = NOVEL_DATA.gallery.length ? `
    <div class="novel-gallery">
      ${NOVEL_DATA.gallery.map((src) => `
        <img
          class="novel-gallery-image"
          src="${escapeHtml(src)}"
          alt="Designated Survivor: Bangkok — scene illustration"
          loading="lazy"
          onerror="this.style.display='none'"
        />
      `).join("")}
    </div>
  ` : "";

  container.innerHTML = `
    <div class="novel-grid">
      <div class="novel-cover-wrap">
        <img
          src="${escapeHtml(NOVEL_DATA.coverImage)}"
          alt="${escapeHtml(NOVEL_DATA.title)}"
          class="novel-cover"
          onerror="this.src='${escapeHtml(NOVEL_DATA.coverFallback)}'"
        />
        <div class="novel-badge">CLASSIFIED</div>
      </div>
      <div class="novel-details">
        <p class="novel-tagline">"${escapeHtml(NOVEL_DATA.tagline)}"</p>
        <p class="novel-summary">${escapeHtml(NOVEL_DATA.summary)}</p>
        <div class="novel-meta">
          <div class="novel-meta-item">
            <span class="meta-label">STATUS:</span>
            <span class="meta-value">DEPLOYING — CHAPTERS 1-3</span>
          </div>
          <div class="novel-meta-item">
            <span class="meta-label">LATEST:</span>
            <span class="meta-value">${escapeHtml(NOVEL_DATA.latestDate)}</span>
          </div>
          <div class="novel-meta-item">
            <span class="meta-label">AUTHOR:</span>
            <span class="meta-value">Dr. Non Arkaraprasertkul</span>
          </div>
          <div id="novelChapters" class="novel-chapters">
            ${NOVEL_DATA.chapters.map((ch) => {
              const isLatest = ch === NOVEL_DATA.latestChapter;
              return `<div class="novel-chapter-tag${isLatest ? " novel-chapter-tag--latest" : ""}">
                ${escapeHtml(ch)}${isLatest ? '<span class="novel-chapter-badge">NEW</span>' : ""}
              </div>`;
            }).join("")}
          </div>
        </div>
        <a href="${escapeHtml(NOVEL_DATA.url)}" target="_blank" rel="noreferrer" class="button button-primary utility-button novel-cta">Read on Substack</a>
      </div>
    </div>
    ${galleryHtml}
  `;
}

initTabs();
initLightbox();
bindEvents();
renderLabLogos();
renderProfile({ monitoredPages: 0 });
renderFooter();
renderMentions();
renderApiRegistry();
renderFieldRecord();
renderHistoryGallery();
renderOriginStory();
renderUniversalBlueprint();
renderNovelSection();
renderVersionHistory();
startClock();
renderLocalTargets();
applyModeUI();
scheduleRefresh();
refreshDashboard(true);

if (elements.copyBlueprintButton) {
  elements.copyBlueprintButton.addEventListener("click", handleBlueprintCopy);
}
