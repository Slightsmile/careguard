type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const serialized = JSON.stringify(entry);
  if (level === "ERROR") {
    console.error(serialized);
  } else if (level === "WARN") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("INFO", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("WARN", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("ERROR", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log("DEBUG", message, meta),
};
