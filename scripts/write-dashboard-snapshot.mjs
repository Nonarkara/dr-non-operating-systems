process.env.NO_LISTEN = "1";

const { service } = await import("../server.js");

const result = await service.runScanJob({
  actor: process.env.GITHUB_ACTIONS ? "github-actions" : "local-cli",
  source: process.env.GITHUB_ACTIONS ? "github-actions" : "cli",
  publish: true,
  force: true,
  reason: "snapshot-script"
});

console.log(
  JSON.stringify(
    {
      jobId: result.job.id,
      generatedAt: result.payload.generatedAt,
      published: result.published,
      preservedPreviousSnapshot: result.preservedPreviousSnapshot,
      monitoredPages: result.payload.summary.monitoredPages
    },
    null,
    2
  )
);
