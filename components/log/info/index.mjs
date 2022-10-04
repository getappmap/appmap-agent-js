const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { levelLog } = await import(`../level.mjs${__search}`);
const Log = await import(`../../log-inner/index.mjs${__search}`);

export const {
  logDebug,
  logGuardDebug,
  logInfo,
  logGuardInfo,
  logWarning,
  logGuardWarning,
  logError,
  logGuardError,
} = levelLog(Log, "Info");
