import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

process.env.NO_LISTEN = "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = dirname(__dirname);
const dataDir = join(repoRoot, "public", "data");
const snapshotPath = join(dataDir, "dashboard-snapshot.json");
const WORKFLOW_URL =
  "https://github.com/Nonarkara/dr-non-operating-systems/actions/workflows/update-dashboard-snapshot.yml";

const {
  getDashboardData,
  hydrateHistoryFromSnapshot,
  healthHistory,
  analyticsData,
  alertsData,
  triggersData,
  flushHealthHistory,
  flushAnalytics,
  flushAlerts,
  flushTriggers,
  supabaseFlushAllDailyUptime,
  supabaseFlushVisitorDaily
} = await import("../server.js");

async function loadPreviousSnapshot() {
  try {
    const previous = JSON.parse(await readFile(snapshotPath, "utf8"));
    hydrateHistoryFromSnapshot(previous);
    return previous;
  } catch {
    hydrateHistoryFromSnapshot(null);
    return null;
  }
}

function isLikelyNetworkFailure(message) {
  return /fetch failed|network|timed out|econn|enotfound|eai_again|socket|tls|certificate|terminated/i.test(
    String(message || "")
  );
}

function isNetworkOfflineTarget(target) {
  return target?.health?.code === "offline" && isLikelyNetworkFailure(target.health?.reason);
}

function shouldPreservePreviousSnapshot(previousSnapshot, payload) {
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

function buildSnapshotMeta(overrides = {}) {
  return {
    generatedBy: process.env.GITHUB_ACTIONS ? "GitHub Actions" : "Local snapshot command",
    mode: "snapshot",
    workflowUrl: WORKFLOW_URL,
    ...overrides
  };
}

function shouldReusePreviousGithub(previousSnapshot, payload) {
  return previousSnapshot?.github?.status === "live" && payload?.github?.status === "offline";
}

function shouldReusePreviousMentions(previousSnapshot, payload) {
  return previousSnapshot?.mentions?.status && previousSnapshot.mentions.status !== "offline"
    && payload?.mentions?.status === "offline";
}

function mergeDependencyFallbacks(previousSnapshot, payload) {
  const preserveGithub = shouldReusePreviousGithub(previousSnapshot, payload);
  const preserveMentions = shouldReusePreviousMentions(previousSnapshot, payload);
  const github = preserveGithub ? previousSnapshot.github : payload.github;
  const mentions = preserveMentions ? previousSnapshot.mentions : payload.mentions;

  return {
    ...payload,
    github,
    mentions,
    summary: {
      ...payload.summary,
      publicRepos: github?.profile?.publicRepos ?? payload?.summary?.publicRepos ?? null
    },
    snapshotMeta: buildSnapshotMeta({
      preservedGithub: preserveGithub,
      preservedMentions: preserveMentions,
      preservedPreviousData: false
    })
  };
}

await mkdir(dataDir, { recursive: true });
const previousSnapshot = await loadPreviousSnapshot();

const payload = await getDashboardData(true);
const preservePreviousSnapshot = shouldPreservePreviousSnapshot(previousSnapshot, payload);
if (preservePreviousSnapshot) {
  console.log(`Preserved previous snapshot at ${snapshotPath} because the live scan failed network-wide.`);
} else {
  const snapshot = mergeDependencyFallbacks(previousSnapshot, payload);

  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote snapshot to ${snapshotPath}`);
}

/* Flush all persistent data files */
await flushHealthHistory();
console.log("Flushed health-history.json");
await flushAnalytics();
console.log("Flushed analytics.json");
await flushAlerts();
console.log("Flushed alerts.json");
await flushTriggers();
console.log("Flushed triggers.json");

/* Flush to Supabase (if configured) */
if (process.env.SUPABASE_URL) {
  const targets = payload?.targets ?? [];
  await supabaseFlushAllDailyUptime(targets);
  await supabaseFlushVisitorDaily();
  console.log("Flushed to Supabase");
} else {
  console.log("Supabase not configured — skipped");
}
