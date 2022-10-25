const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

export const { noop: logDebug } = await import(
  `../../util/index.mjs${__search}`
);

export const {
  console: { info: logInfo, warn: logWarning, error: logError },
} = globalThis;
