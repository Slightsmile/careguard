import { app } from "./app";
import { config } from "./utils/config";
import { logger } from "./utils/logger";
import { startMonitorScheduler } from "./jobs/monitor.scheduler";

app.listen(config.port, () => {
  logger.info("Backend server started", { port: config.port, env: config.nodeEnv });
  startMonitorScheduler(config.monitorIntervalMs);
});
