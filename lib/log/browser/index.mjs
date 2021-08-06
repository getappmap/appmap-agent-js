export default (dependencies) => {
  const {
    assert: { format },
    util: { noop },
  } = dependencies;
  const generateLog =
    (name) =>
    (template, ...values) => {
      /* eslint-disable no-console */
      console[name](format(template, values));
      /* eslint-enable no-console */
    };
  return {
    logDebug: noop,
    logInfo: generateLog("info"),
    logWarning: generateLog("warn"),
    logError: generateLog("error"),
  };
};
