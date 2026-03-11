import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

process.env.NO_LISTEN = "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = dirname(__dirname);
const snapshotPath = join(repoRoot, "public", "data", "dashboard-snapshot.json");
const WORKFLOW_URL =
  "https://github.com/Nonarkara/dr-non-operating-systems/actions/workflows/update-dashboard-snapshot.yml";

const { getDashboardData, hydrateHistoryFromSnapshot } = await import("../server.js");

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

await mkdir(dirname(snapshotPath), { recursive: true });
const previousSnapshot = await loadPreviousSnapshot();

const payload = await getDashboardData(true);
const preservePreviousSnapshot = shouldPreservePreviousSnapshot(previousSnapshot, payload);
if (preservePreviousSnapshot) {
  console.log(`Preserved previous snapshot at ${snapshotPath} because the live scan failed network-wide.`);
} else {
  const snapshot = {
    ...payload,
    snapshotMeta: buildSnapshotMeta({
      preservedPreviousData: false
    })
  };

  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote snapshot to ${snapshotPath}`);
}
