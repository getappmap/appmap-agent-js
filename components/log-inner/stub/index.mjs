const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { noop } = await import(`../../util/index.mjs${__search}`);

export const logDebug = noop;

export const logInfo = noop;

export const logWarning = noop;

export const logError = noop;
