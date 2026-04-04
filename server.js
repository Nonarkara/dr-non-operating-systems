import { config, logger, server, service } from "./src/app.js";

export { config, logger, server, service };

if (!config.server.noListen) {
  server.listen(config.server.port, config.server.host, () => {
    logger.info("server.listening", {
      host: config.server.host,
      port: config.server.port
    });
  });
}
