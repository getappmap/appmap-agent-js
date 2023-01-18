import { stdout, env } from "node:process";
import { hasOwnProperty, format } from "../../util/index.mjs";

const enabled = hasOwnProperty(env, "APPMAP_TEST_LOGGING");

const log = (template, ...rest) => {
  const message = format(template, rest);
  if (enabled) {
    stdout.write(`${message}\n`);
  }
};

const logWhen = (guard, template, ...rest) => {
  const message = format(template, rest);
  if (guard && enabled) {
    stdout.write(`${message}\n`);
  }
  return guard;
};

export const logDebug = log;
export const logInfo = log;
export const logWarning = log;
export const logError = log;
export const logDebugWhen = logWhen;
export const logInfoWhen = logWhen;
export const logWarningWhen = logWhen;
export const logErrorWhen = logWhen;
