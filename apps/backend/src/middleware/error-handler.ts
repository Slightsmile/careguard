import type { ErrorRequestHandler, Request, Response } from "express";
import { logger } from "../utils/logger";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

/**
 * Centralized error handler. Must be registered last, after all routes.
 * Never leaks stack traces or internal details to the client.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error("Unhandled request error", {
    method: req.method,
    path: req.path,
    error: err instanceof Error ? err.message : String(err),
  });

  if (res.headersSent) {
    return;
  }

  const isBodyParseError = err instanceof SyntaxError && "body" in (err as object);
  if (isBodyParseError) {
    res.status(400).json({ error: "Malformed JSON body" });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
};
