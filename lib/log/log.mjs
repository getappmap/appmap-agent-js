
const {log} = console;
const _Map = Map;

const DEBUG_LEVEL = 1;
const INFO_LEVEL = 2;
const WARN_LEVEL = 3;
const ERROR_LEVEL = 4;
const OFF_LEVEL = 5;

const levels = new _Map([
  ["DEBUG", DEBUG_LEVEL],
  ["INFO", INFO_LEVEL],
  ["WARN", WARN_LEVEL],
  ["ERROR", ERROR_LEVEL],
  ["OFF", OFF_LEVEL],
]);

export default (min_level_name) => (dependencies) => {
  const {assert: {format}} = dependencies;
  const min_level = levels.get(min_level_name);
  const noop = () => {};
  const makeLog = (level_name) =>
    levels.get(level_name) >= min_level
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
