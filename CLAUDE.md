# CLAUDE.md — `dr-non-operating-systems`

> Read this first. It covers the non-obvious bits that will trip you up otherwise.

## What this repo is

**Public name:** *Dr Non's Operating Systems* — a live-ish dashboard at [nonarkara.github.io/dr-non-operating-systems](https://nonarkara.github.io/dr-non-operating-systems/) that monitors all of Non's deployed projects (11 targets across Render and elsewhere), surfaces GitHub activity, and tracks press mentions.

**Internal name:** `non-operations-radar` (see `package.json`), v3.0.0. ES modules, Node 22, no bundler, no framework — intentionally simple.

**Two deployment surfaces, different roles:**
- **GitHub Pages** serves `public/` as a static dashboard (this is what the world sees).
- **Render** runs `server.js` at `dr-non-operating-systems.onrender.com` as the admin/scan API. The public dashboard never talks to Render directly — it reads the JSON files under `public/data/` that a GitHub Actions cron job writes every 2 hours.

This split is important: **the static site is fed by scheduled snapshots, not live requests.** See "Localhost-only live mode" gotcha below.

## Who you're working with

Non is an architect and anthropologist, not a programmer. When proposing changes:
- Give terminal commands step-by-step, one block at a time, with what to expect.
- Don't assume familiarity with npm, git internals, or Node APIs — but don't condescend either. He picks things up fast.
- When in doubt about a destructive action (deleting files, force-pushing, schema migrations), stop and ask.

## Repo layout

```
server.js                  # 71KB — admin API + scheduler + analytics. Single file, on purpose.
package.json               # 3 scripts: smoke, snapshot, start
public/                    # Deployed to GitHub Pages
  index.html, app.js, styles.css
  data/*.json              # Snapshot outputs. Committed by the update-dashboard-snapshot workflow.
scripts/
  smoke-check.mjs          # Pre-deploy health check (runs in CI before Pages publish)
  write-dashboard-snapshot.mjs  # The "scan everything and write JSON" job
supabase/migrations/       # 001 monitoring tables, 002 bandwidth telemetry
.github/workflows/
  deploy-pages.yml         # On push to main → smoke test → deploy public/ to Pages
  update-dashboard-snapshot.yml  # Cron 17 */2 * * * — regenerate data/*.json
  watchdog.yml             # Cron */30 * * * * — curl all 11 targets, open issue on failure
render.yaml                # Render service definition (service name: dr-non-operating-systems)
vercel.json                # Present on feature branches; main deploys via GitHub Pages
```

## Branches

- **`main`** — production. Latest: `V5.2 The Polished Instrument` (glassmorphism, animations).
- **`refactor/pure-monitoring`** — in-progress module extraction; the "Migrate NON.OS from Render to GitHub Pages and clean up assets" line of work.
- **`codex/red-dot-backend`** — alternate hardened-backend branch with `src/`, `test/`, `vercel.json`. Adds a design-system polish layer. Not merged. If Non asks about "red dot," this is it.

**Default:** work on `main` unless explicitly told otherwise.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Run `server.js` on `PORT` (default 4178), `HOST` (default 127.0.0.1). |
| `npm run smoke` | Boot server with `NO_LISTEN=1`, hit `/api/health`, `/api/dashboard`, `/data/dashboard-snapshot.json`, `/index.html`, validate shapes. Used in CI before Pages deploy. |
| `npm run snapshot` | Execute the full scan: hit all 11 targets, fetch GitHub profile/repos/mentions, write all `public/data/*.json`, optionally upsert to Supabase. This is what the 2-hour cron runs. |
| `npm test` | `node --test` on anything in `test/` (only present on `codex/red-dot-backend`). |

## Admin API (`server.js`)

Read-only public endpoints + a few POST endpoints for scheduler/triggers. **No bearer token auth in the current main-branch code** — it assumes network isolation. The three "live" endpoints return live data only when the request host looks localhost-like (127.0.0.1, ::1, `.local`, RFC1918); otherwise they serve the on-disk snapshot. This is the main trick to remember.

Selected routes:
- `GET /api/health` — live or snapshot depending on host
- `GET /api/dashboard[?force=1]` — same
- `GET /api/mentions` — same
- `GET /api/snapshots` — 30 most recent snapshot commits
- `GET /api/snapshots/:sha` — historical snapshot (SHA 7–40 chars, LRU cache of 15)
- `GET /api/analytics` — per-project visitor counts
- `POST /api/beacon` — pageview ingest (geo-resolves IPs in 1.5s batches, 24h cache)
- `GET /api/alerts` — `{active, recent}`
- `GET /api/triggers?status=open|claimed|resolved`
- `POST /api/triggers/:id/claim` — `{claimedBy}`
- `POST /api/triggers/:id/resolve` — `{resolution?}`
- `GET|POST /api/scheduler` — read state / toggle on-off

## Scheduler

Starts automatically on server boot unless `NO_LISTEN=1`. Two cadences, both on Asia/Bangkok time:
- **Business hours (08:00–20:00 Bangkok):** every 10 min
- **Quiet hours (20:00–08:00 Bangkok):** every 60 min

Each tick: fetch each target URL → compute uptime → detect state transitions → fire alerts → upsert Supabase. There's a **30-min alert cooldown per target+type** (`ALERT_COOLDOWN_MS`) to prevent spam.

Health-history and analytics are flushed to disk every 5 min (`HISTORY_FLUSH_MS`).

## Snapshot workflow (GitHub Actions)

`update-dashboard-snapshot.yml` runs at **`:17` past every even hour UTC** (02:17, 04:17, …) and on manual dispatch. It:
1. Runs `npm test`.
2. Runs `npm run snapshot` which starts the server in NO_LISTEN mode and executes `write-dashboard-snapshot.mjs`.
3. `git add`s the data files; commits as `github-actions[bot]` with message `Update dashboard snapshot and monitoring data`; pushes.

**Important:** if a network-wide failure is detected (all targets and GitHub both offline), the script preserves the previous snapshot instead of writing offline data. Don't "fix" this.

## Watchdog (GitHub Actions)

`watchdog.yml` runs every 30 min. It `curl`s each of the 11 target URLs directly. On failure, it opens a GitHub issue labeled `watchdog` (or appends to the existing open one). No Render dependency.

**The target list is hardcoded in both `server.js` (TARGETS array) and `watchdog.yml`.** If you add/remove/rename a target, update both — they drift.

## Data contract (`public/data/*.json`)

The frontend (`public/app.js`) reads these files directly. If you change their shape, you break the dashboard.

| File | Purpose | Cap |
|---|---|---|
| `dashboard-snapshot.json` | Full system state: `{generatedAt, github:{profile,recentRepos,stats,status}, mentions:{items,status}, targets:[...], summary:{...}}` | 1 |
| `health-history.json` | `{targets: {[id]: {hourly: [...]}}}` | 720 hourly buckets |
| `analytics.json` | Per-project visitor rollups | 90 days |
| `alerts.json` | Incident log | 500 |
| `triggers.json` | Action items | 100 |

## Env vars (read by `server.js` and scripts)

Required for live data:
- `GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_API_TOKEN` — GitHub API (profile, repos, activity)

Optional but meaningful:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (or `SUPABASE_ANON_KEY`) — if set, snapshot flushes to Supabase
- `ALERT_WEBHOOK_URL` — downtime webhook
- `SHEETS_WEBHOOK_URL` — Google Sheets logging
- `HOST`, `PORT` — listen config
- `NO_LISTEN=1` — boot without opening a port (used by smoke/snapshot scripts)

Everything `ADMIN_BEARER_TOKEN`-related in older docs or the `codex/red-dot-backend` branch is from that alternate branch, not main.

## Supabase schema

Migration `001_monitoring_tables.sql` creates: `daily_uptime`, `incidents`, `visitor_daily`, `reliability_weekly`. Public read via RLS, service-key write.

Migration `002_bandwidth_telemetry.sql` adds: `bandwidth_checks` (append-only) and extends `daily_uptime` with p50/p95/byte/cache-hit columns.

When adding migrations: number sequentially, RLS public-read + service-key-write, include down-safe schema (no destructive drops without backup).

## Gotchas (read these)

1. **Public Render URL serves snapshots, not live data.** `/api/health` and `/api/dashboard` only go live when the request host looks localhost-like. Don't try to "fix" this — it's the whole architecture.
2. **Two sources of truth for targets.** `TARGETS` array in `server.js` and the map in `watchdog.yml`. They must stay in sync manually.
3. **No auth on triggers/scheduler POST endpoints.** Safe only because the Render deployment isn't heavily advertised. Don't expose these more widely without adding a bearer check.
4. **Snapshot cron is `:17` past even hours UTC** — not on the hour. If a commit race is suspected, check timing against that offset.
5. **`NO_LISTEN=1` is the boot mode for scripts.** Don't remove the guard — both `smoke-check.mjs` and `write-dashboard-snapshot.mjs` depend on it to import `server.js` without opening a port.
6. **The 143KB `public/app.js` is vanilla JS on purpose.** No build step. Resist the urge to convert it to a framework without discussing with Non.
7. **Commits by `github-actions[bot]` are data-only.** They touch `public/data/*.json` and nothing else. If one touches code, something's wrong.
8. **Two locales for mentions** (Global/US + Thailand). Both baked into every snapshot.

## Working on this repo

- Branch off `main` for any code change.
- Run `npm run smoke` locally before pushing — the Pages deploy will block on it anyway.
- `npm run snapshot` locally is safe but will rewrite every `public/data/*.json`; don't commit those changes unless you mean to.
- If you need to test without hitting the network, most of the scan paths accept a previous snapshot as fallback — see `write-dashboard-snapshot.mjs`.
- When adding a target: update `TARGETS` in `server.js`, the map in `.github/workflows/watchdog.yml`, and (if needed) the hardcoded service-name map for auto-restarts.

## Related projects (cross-refs)

The 11 monitored targets are themselves repos under `github.com/Nonarkara`. See `~/Projects/INDEX.md` for the full directory — most live under `conflict-tracker/`, `slic-index/`, `phuket/`, `thailand-smart-city/`, `asean/`, `bots/`.
