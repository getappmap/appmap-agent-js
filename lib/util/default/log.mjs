
const {log} = console;

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

export default (dependencies) => {
  const {
    globals: {LOG_LEVEL},
    assert: {assert}
  } = dependencies;
  assert(levels.has(LOG_LEVEL), "invalid log level %o", LOG_LEVEL);
  const level = levels.get(LOG_LEVEL);
  const noop = () => {};
  const makeLog = (name) =>
    levels.get(name) >= level
      ? (template, ...values) => {
        log(`${name} ${format(template, values)}`);
      }
      : noop;
  return {
    logDebug: makeLog("DEBUG"),
    logInfo: makeLog("INFO"),
    logWarn: makeLog("WARN"),
    logError: makeLog("ERROR"),
  };
};
