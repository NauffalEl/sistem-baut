// Simple structured logger for production
type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLogPriority(): number {
  const level = (process.env.LOG_LEVEL as LogLevel) || "info";
  return LOG_LEVEL_PRIORITY[level] ?? LOG_LEVEL_PRIORITY.info;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, ...meta: unknown[]) {
  if (LOG_LEVEL_PRIORITY[level] < getLogPriority()) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  meta.forEach((m) => {
    if (typeof m === "object" && m !== null) {
      Object.assign(entry, m);
    }
  });

  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}

export const logger = {
  debug: (msg: string, ...meta: unknown[]) => log("debug", msg, ...meta),
  info: (msg: string, ...meta: unknown[]) => log("info", msg, ...meta),
  warn: (msg: string, ...meta: unknown[]) => log("warn", msg, ...meta),
  error: (msg: string, ...meta: unknown[]) => log("error", msg, ...meta),
};
