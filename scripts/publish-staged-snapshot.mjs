process.env.NO_LISTEN = "1";

const { service } = await import("../server.js");

const snapshot = await service.publishStagedSnapshot({
  actor: "cli",
  source: "cli",
  reason: "manual-staged-publish"
});

console.log(
  JSON.stringify(
    {
      generatedAt: snapshot.generatedAt,
      snapshotMeta: snapshot.snapshotMeta
    },
    null,
    2
  )
);
