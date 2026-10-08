import express from "express";
import cors from "cors";
import { config } from "./utils/config";
import { healthRouter } from "./routes/health.routes";
import { monitorRouter } from "./routes/monitor.routes";
import { apisRouter } from "./routes/apis.routes";
import { alertsRouter } from "./routes/alerts.routes";
import { mockApisRouter } from "./mock-apis/mock-apis.routes";
import { monitorRateLimiter } from "./middleware/rate-limit";
import { notFoundHandler, errorHandler } from "./middleware/error-handler";

export const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

app.use(healthRouter);
app.use("/monitor", monitorRateLimiter);
app.use(monitorRouter);
app.use(apisRouter);
app.use(alertsRouter);
app.use(mockApisRouter);

app.use(notFoundHandler);
app.use(errorHandler);
