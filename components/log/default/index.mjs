const { URL } = globalThis;

const { search: __search, searchParams: __params } = new URL(import.meta.url);

const { hasOwnProperty, noop, assert } = await import(
  `../../util/index.mjs${__search}`
);

const {
  logDebug: logDebugInner,
  logInfo: logInfoInner,
  logWarning: logWarningInner,
  logError: logErrorInner,
} = await import(`../../log-inner/index.mjs${__search}`);

const levels = {
  debug: 1,
  info: 2,
  warning: 3,
  error: 4,
  off: 5,
};

const max_level = __params.has("log-level")
  ? __params.get("log-level")
  : "info";

assert(hasOwnProperty(levels, max_level), "invalid log level");

const generateLog = (level, log) => {
  if (levels[level] < levels[max_level]) {
    return {
      log: noop,
      logGuard: noop,
    };
  } else {
    return {
      log,
      logGuard: (guard, ...args) => {
        if (guard) {
          log(...args);
        }
      },
    };
  }
};

export const { log: logDebug, logGuard: logGuardDebug } = generateLog(
  "debug",
  logDebugInner,
);

export const { log: logInfo, logGuard: logGuardInfo } = generateLog(
  "info",
  logInfoInner,
);

export const { log: logWarning, logGuard: logGuardWarning } = generateLog(
  "warning",
  logWarningInner,
);

export const { log: logError, logGuard: logGuardError } = generateLog(
  "error",
  logErrorInner,
);
