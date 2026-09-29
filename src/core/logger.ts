import { LOG_LEVEL } from "./config";

const PRIORITY = { debug: 10, info: 20, success: 20, warn: 30, error: 40, silent: 50 };
const COLOR = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  success: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";
const threshold = PRIORITY[LOG_LEVEL as keyof typeof PRIORITY] ?? PRIORITY.info;

type Level = keyof typeof COLOR;

const SINK: Record<Level, (...args: unknown[]) => void> = {
  debug: console.debug,
  info: console.log,
  success: console.log,
  warn: console.warn,
  error: console.error,
};

function write(level: Level, message: unknown, args: unknown[]) {
  if (PRIORITY[level] < threshold) return;
  const prefix = `${COLOR.debug}[${new Date().toLocaleTimeString()}]${RESET} ${COLOR[level]}[${level.toUpperCase()}]${RESET}`;
  if (typeof message === "string") SINK[level](`${prefix} ${message}`, ...args);
  else SINK[level](prefix, message, ...args);
}

export const Logger = {
  debug: (message: unknown, ...args: unknown[]) => write("debug", message, args),
  info: (message: unknown, ...args: unknown[]) => write("info", message, args),
  success: (message: unknown, ...args: unknown[]) => write("success", message, args),
  warn: (message: unknown, ...args: unknown[]) => write("warn", message, args),
  error: (message: unknown, ...args: unknown[]) => write("error", message, args),
};
