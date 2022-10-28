const { URL } = globalThis;

const { search: __search, searchParams: __params } = new URL(import.meta.url);

const { format } = await import(`../../util/index.mjs${__search}`);

const log = (template, ...rest) => {
  format(template, rest);
};

const logWhen = (guard, template, ...rest) => {
  format(template, rest);
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
