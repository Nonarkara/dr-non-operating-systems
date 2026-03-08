import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

process.env.NO_LISTEN = "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = dirname(__dirname);
const snapshotPath = join(repoRoot, "public", "data", "dashboard-snapshot.json");

const { getDashboardData, hydrateHistoryFromSnapshot } = await import("../server.js");

async function loadPreviousSnapshot() {
  try {
    const previous = JSON.parse(await readFile(snapshotPath, "utf8"));
    hydrateHistoryFromSnapshot(previous);
  } catch {
    hydrateHistoryFromSnapshot(null);
  }
}

await mkdir(dirname(snapshotPath), { recursive: true });
await loadPreviousSnapshot();

const payload = await getDashboardData(true);
const snapshot = {
  ...payload,
  snapshotMeta: {
    generatedBy: process.env.GITHUB_ACTIONS ? "GitHub Actions" : "Local snapshot command",
    mode: "snapshot",
    workflowUrl:
      "https://github.com/Nonarkara/dr-non-operating-systems/actions/workflows/update-dashboard-snapshot.yml"
  }
};

await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Wrote snapshot to ${snapshotPath}`);
