const {
  env: global_process_env,
  stdout: global_process_stdout,
  stderr: global_process_stderr,
} = process;
const { from: global_Array_from } = Array;

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

const names = global_Array_from(levels.keys());

export default (dependencies) => {
  const {
    expect: { expect },
    util: { hasOwnProperty, format, noop },
  } = dependencies;
  let level = OFF_LEVEL;
  if (hasOwnProperty(global_process_env, "APPMAP_LOG_LEVEL")) {
    const value = global_process_env.APPMAP_LOG_LEVEL.toUpperCase();
    expect(
      levels.has(value),
      "invalid log level %j, expected one of: %j",
      value,
      names,
    );
    level = levels.get(value);
  }
  const makeLog = (name, writable) =>
    levels.get(name) >= level
      ? (template, ...values) => {
          writable.write(`${name} ${format(template, values)}${"\n"}`);
        }
      : noop;
  return {
    logDebug: makeLog("DEBUG", global_process_stdout),
    logInfo: makeLog("INFO", global_process_stdout),
    logWarn: makeLog("WARN", global_process_stderr),
    logError: makeLog("ERROR", global_process_stderr),
  };
};
