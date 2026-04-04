process.env.NO_LISTEN = "1";

const { service } = await import("../server.js");

const publish = process.argv.includes("--no-publish") ? false : true;
const force = process.argv.includes("--no-force") ? false : true;

const result = await service.runScanJob({
  actor: "cli",
  source: "cli",
  publish,
  force,
  reason: "manual-cli-run"
});

console.log(JSON.stringify(result, null, 2));
