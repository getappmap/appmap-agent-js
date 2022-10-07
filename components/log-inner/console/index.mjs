const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { format, noop } = await import(`../../util/index.mjs${__search}`);

const generateLog =
  (name) =>
  (template, ...values) => {
    /* eslint-disable no-console */
    console[name](format(template, values));
    /* eslint-enable no-console */
  };

export const logDebug = noop;

export const logInfo = generateLog("info");

export const logWarning = generateLog("warn");

export const logError = generateLog("error");
