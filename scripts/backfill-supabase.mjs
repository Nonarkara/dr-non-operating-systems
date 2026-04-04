process.env.NO_LISTEN = "1";

const { service } = await import("../server.js");

const result = await service.backfillToSupabase({
  actor: "cli",
  source: "cli"
});

console.log(JSON.stringify(result, null, 2));
