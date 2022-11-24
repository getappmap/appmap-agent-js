import { env } from "node:process";
import { InternalAppmapError } from "../../error/index.mjs";
import { hasOwnProperty, noop, assert, format } from "../../util/index.mjs";
import {
  logDebug as logDebugInner,
  logInfo as logInfoInner,
  logWarning as logWarningInner,
  logError as logErrorInner,
} from "../../log-inner/index.mjs";

const levels = {
  debug: 1,
  info: 2,
  warning: 3,
  error: 4,
  off: 5,
};

/* c8 ignore start */
const max_level = hasOwnProperty(env, "APPMAP_LOG_LEVEL")
  ? env.APPMAP_LOG_LEVEL
  : "info";
/* c8 ignore stop */

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
