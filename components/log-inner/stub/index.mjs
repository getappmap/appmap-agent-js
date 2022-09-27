export default (dependencies) => {
  const {
    util: { format },
  } = dependencies;
  const checkFormat = (template, ...values) => {
    format(template, values);
  };
  return {
    logDebug: checkFormat,
    logInfo: checkFormat,
    logWarning: checkFormat,
    logError: checkFormat,
  };
};
