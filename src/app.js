import { createConfig, getEnvironmentIssues } from "./config.js";
import { createAppServer } from "./create-server.js";
import { createRequestContext } from "./lib/http.js";
import { createLogger } from "./lib/logger.js";
import { FileRepository } from "./repositories/files.js";
import { SupabaseRepository } from "./repositories/supabase.js";
import { OperationsService } from "./services/operations-service.js";

const config = createConfig();
const logger = createLogger("operations-radar");
const environmentIssues = getEnvironmentIssues(config);
const fileRepository = new FileRepository(config);
const supabaseRepository = new SupabaseRepository(config, { logger });
const service = new OperationsService({
  config,
  logger,
  fileRepository,
  supabaseRepository,
  environmentIssues
});

await service.initialize();

for (const issue of environmentIssues) {
  const logMethod = issue.severity === "error" ? "error" : issue.severity === "warning" ? "warn" : "info";
  logger[logMethod]("config.issue", issue);
}

const server = createAppServer({
  config,
  service,
  logger,
  createRequestContext
});

export {
  config,
  environmentIssues,
  fileRepository,
  logger,
  server,
  service,
  supabaseRepository
};
