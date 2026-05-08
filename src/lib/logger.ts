type LogLevel = "debug" | "info" | "warn" | "error";

const isProduction = import.meta.env.PROD;

export function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (isProduction && (level === "debug" || level === "info")) {
    return;
  }

  const payload = context ? [message, context] : [message];

  if (level === "error") {
    console.error(...payload);
    return;
  }

  if (level === "warn") {
    console.warn(...payload);
    return;
  }

  console.log(...payload);
}
