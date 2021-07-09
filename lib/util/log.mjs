import { noop } from "./basic/index.mjs";
import { hasOwnProperty } from "./object.mjs";
import { format } from "./format.mjs";
import { expect } from "./expect.mjs";

/* c8 ignore start */
/* eslint-disable no-undef */
const global_process = typeof process !== undefined ? process : null;
/* eslint-enable no-undef */
/* c8 ignore stop */

const ALL_LEVEL = 0;
const DEBUG_LEVEL = 1;
const INFO_LEVEL = 2;
const WARN_LEVEL = 3;
const ERROR_LEVEL = 4;
const OFF_LEVEL = 5;

const levels = new Map([
  ["ALL", ALL_LEVEL],
  ["DEBUG", DEBUG_LEVEL],
  ["INFO", INFO_LEVEL],
  ["WARN", WARN_LEVEL],
  ["ERROR", ERROR_LEVEL],
  ["OFF", OFF_LEVEL],
]);

let level = OFF_LEVEL;

if (
  global_process !== null &&
  hasOwnProperty(global_process, "env") &&
  typeof global_process.env === "object" &&
  global_process.env !== null &&
  hasOwnProperty(global_process.env, "APPMAP_LOG_LEVEL")
) {
  const value = global_process.env.APPMAP_LOG_LEVEL.toUpperCase();
  expect(levels.has(value), "invalid log level %j", value);
  level = levels.get(value);
}

const makeLog = (name) =>
  levels.get(name) >= level
    ? (template, ...values) => {
        global_process.stdout.write(
          `${name} ${format(template, values)}${"\n"}`,
        );
      }
    : noop;

export const logDebug = makeLog("DEBUG");
export const logInfo = makeLog("INFO");
export const logWarn = makeLog("WARN");
export const logError = makeLog("ERROR");
