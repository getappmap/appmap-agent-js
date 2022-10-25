const { URL } = globalThis;

const { search: __search, searchParams: __params } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { hasOwnProperty, noop, assert, format } = await import(
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

assert(
  hasOwnProperty(levels, max_level),
  "invalid log level",
  InternalAppmapError,
);

const generateLog = (level, log) => {
  if (levels[level] < levels[max_level]) {
    return {
      log: noop,
      logWhen: noop,
      logAssert: assert,
    };
  } else {
    return {
      log: (template, ...rest) => {
        log(format(template, rest));
      },
      logWhen: (guard, template, ...rest) => {
        if (guard) {
          log(format(template, rest));
        }
        return guard;
      },
    };
  }
};

export const { log: logDebug, logWhen: logDebugWhen } = generateLog(
  "debug",
  logDebugInner,
);

export const { log: logInfo, logWhen: logInfoWhen } = generateLog(
  "info",
  logInfoInner,
);

export const { log: logWarning, logWhen: logWarningWhen } = generateLog(
  "warning",
  logWarningInner,
);

export const { log: logError, logWhen: logErrorWhen } = generateLog(
  "error",
  logErrorInner,
);
