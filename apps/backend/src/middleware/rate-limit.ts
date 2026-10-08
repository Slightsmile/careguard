import rateLimit from "express-rate-limit";

/**
 * Guards expensive/mutating monitoring endpoints from accidental or abusive
 * rapid-fire calls (e.g. a misbehaving script hammering /monitor/run).
 */
export const monitorRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many monitoring requests, please slow down." },
});
