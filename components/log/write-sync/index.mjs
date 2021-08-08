import { writeSync } from "fs";

const { env } = process;

const _Map = Map;

const DEBUG_LEVEL = 1;
const INFO_LEVEL = 2;
const WARN_LEVEL = 3;
const ERROR_LEVEL = 4;
const OFF_LEVEL = 5;

const levels = new _Map([
  ["DEBUG", DEBUG_LEVEL],
  ["INFO", INFO_LEVEL],
  ["WARNING", WARN_LEVEL],
  ["ERROR", ERROR_LEVEL],
  ["OFF", OFF_LEVEL],
]);

export default (dependencies) => {
  const {
    expect: { expect },
    util: { noop, format, coalesce },
  } = dependencies;
  const min_level_name = coalesce(
    env,
    "APPMAP_LOG_LEVEL",
    "WARNING",
  ).toUpperCase();
  expect(levels.has(min_level_name), "invalid log level: %s", min_level_name);
  const min_level = levels.get(min_level_name);
  const generateLog = (level_name) => {
    const level = levels.get(level_name);
    if (level < min_level) {
      return noop;
    }
    const fd = level >= WARN_LEVEL ? 2 : 1;
    return (template, ...values) => {
      writeSync(fd, `${level_name} ${format(template, values)}\n`);
    };
  };
  return {
    logDebug: generateLog("DEBUG"),
    logInfo: generateLog("INFO"),
    logWarning: generateLog("WARNING"),
    logError: generateLog("ERROR"),
  };
};
