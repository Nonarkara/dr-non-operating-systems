process.env.NO_LISTEN = "1";

const { server } = await import("../server.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function listen(serverInstance) {
  await new Promise((resolve, reject) => {
    serverInstance.listen(0, "127.0.0.1", (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function close(serverInstance) {
  await new Promise((resolve, reject) => {
    serverInstance.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

await listen(server);

const address = server.address();
assert(address && typeof address === "object", "Server did not expose a usable address.");
const baseUrl = `http://127.0.0.1:${address.port}`;

try {
  const [healthResponse, dashboardResponse, snapshotResponse, indexResponse] = await Promise.all([
    fetch(`${baseUrl}/api/health`),
    fetch(`${baseUrl}/api/dashboard`),
    fetch(`${baseUrl}/data/dashboard-snapshot.json`),
    fetch(`${baseUrl}/`)
  ]);

  assert(healthResponse.ok, `/api/health returned ${healthResponse.status}`);
  assert(dashboardResponse.ok, `/api/dashboard returned ${dashboardResponse.status}`);
  assert(snapshotResponse.ok, `/data/dashboard-snapshot.json returned ${snapshotResponse.status}`);
  assert(indexResponse.ok, `/ returned ${indexResponse.status}`);

  const health = await healthResponse.json();
  const dashboard = await dashboardResponse.json();
  const snapshot = await snapshotResponse.json();
  const indexHtml = await indexResponse.text();

  assert(["ok", "degraded"].includes(health.status), `Unexpected health status: ${health.status}`);
  assert(typeof health.mode === "string", "Health payload is missing mode.");
  assert(typeof dashboard.generatedAt === "string", "Dashboard payload is missing generatedAt.");
  assert(Array.isArray(dashboard.targets) && dashboard.targets.length > 0, "Dashboard payload has no targets.");
  assert(typeof dashboard.summary?.monitoredPages === "number", "Dashboard payload is missing summary counts.");
  assert(typeof snapshot.generatedAt === "string", "Snapshot payload is missing generatedAt.");
  assert(Array.isArray(snapshot.targets), "Snapshot payload is missing targets.");
  assert(indexHtml.includes("Dr. Non's Operating Systems"), "Index HTML looks wrong.");

  console.log(
    JSON.stringify(
      {
        dashboardStatus: health.status,
        monitoredPages: dashboard.summary.monitoredPages,
        snapshotGeneratedAt: snapshot.generatedAt
      },
      null,
      2
    )
  );
} finally {
  await close(server);
}
