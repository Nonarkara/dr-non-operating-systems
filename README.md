# Dr Non’s Operating Systems

Public operations dashboard for [Dr. Non Arkaraprasertkul](https://github.com/Nonarkara) (NON.OS). It watches a fixed set of his deployed sites, shows GitHub activity, and surfaces recent public mentions — with a profile and archives layer in the same page.

The npm package name is `non-operations-radar`. There is no framework and no bundler: vanilla HTML, CSS, and JavaScript, plus a single Node server.

**Live dashboard:** [nonarkara.github.io/dr-non-operating-systems](https://nonarkara.github.io/dr-non-operating-systems/)

## What you are looking at

| Surface | Role |
| --- | --- |
| GitHub Pages (`public/`) | What visitors see. A static app that reads JSON snapshots under `public/data/`. |
| GitHub Actions | A cron job (every even hour, at `:17` UTC) scans the monitored URLs and GitHub, then commits fresh JSON. A second workflow curls the same URLs every 30 minutes and opens a `watchdog` issue on failure. |
| Optional Node server (`server.js`) | Local or private scanner, scheduler, and admin API. The public site does not call it. |

The dashboard tabs are Systems (fleet health), Intelligence (alerts, mentions, GitHub), Profile, Registry, and Archives. The monitored list lives in `TARGETS` inside `server.js` and is duplicated in `.github/workflows/watchdog.yml`; those two must stay in sync.

This is not a general-purpose OS, knowledge wiki, or published monograph. Some archive copy (origin story, field notes, a linked serial) sits *on* the dashboard; the running system is the monitoring app.

## How to read it

1. Open the [live dashboard](https://nonarkara.github.io/dr-non-operating-systems/) for the latest committed snapshot.
2. Or open `public/index.html` in a browser after cloning. The UI loads `public/data/*.json` next to the page. Stale JSON is expected if you have not run a snapshot.
3. Snapshot files are the data contract for the frontend. Changing their shape without updating `public/app.js` will break the page.

## How to run it

Requires [Node.js](https://nodejs.org/) 22. There are no npm package dependencies.

```bash
git clone https://github.com/Nonarkara/dr-non-operating-systems.git
cd dr-non-operating-systems
npm start
```

The server listens on `http://127.0.0.1:4178` by default (`HOST` / `PORT` override that). Live API responses are only served when the request host looks local; otherwise the on-disk snapshot is returned.

| Command | What it does |
| --- | --- |
| `npm start` | Run the scanner and serve `public/` |
| `npm run smoke` | Boot without a long-lived port, then check `/api/health`, `/api/dashboard`, the snapshot file, and `index.html` |
| `npm run snapshot` | Scan all targets, fetch GitHub profile/repos/mentions, write `public/data/*.json` (and optionally flush to Supabase). Rewrites those files; do not commit them unless you mean to. |

Smoke is what GitHub Pages deploy runs first. Snapshot is what the scheduled workflow runs.

Optional environment variables (names only — put values in a local `.env` or your host’s secret store, never in git):

| Variable | Used for |
| --- | --- |
| `GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_API_TOKEN` | GitHub profile, repos, and activity |
| `SUPABASE_URL` plus `SUPABASE_SERVICE_KEY` or `SUPABASE_ANON_KEY` | Optional long-term uptime/visitor tables (`supabase/migrations/`) |
| `ALERT_WEBHOOK_URL` | Downtime webhook |
| `SHEETS_WEBHOOK_URL` | Optional spreadsheet logging |
| `NO_LISTEN=1` | Import `server.js` without opening a port (smoke and snapshot) |

## License and rights

The **source code in this repository** (the Node scanner, workflows, SQL migrations, and dashboard HTML/CSS/JS) is licensed under the [MIT License](LICENSE).

MIT does **not** cover everything in the tree or everything the dashboard displays:

- Sites in the monitored list remain their own projects, with their own licenses.
- GitHub profile/repo metadata and news-mention snippets are third-party data, fetched for display. Copying them out of a snapshot is not a license grant from this repo.
- Screenshots, logos, portraits, résumé files, and other media under `public/` are not licensed as MIT just because they sit next to the app.
- Linked academic papers, essays, and serialized fiction keep the rights of their publishers and authors.

Reuse this project’s code under MIT. Treat media, writing, and third-party data as someone else’s unless you have a separate grant.
