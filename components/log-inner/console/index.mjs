const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

export { noop as logDebug } from "../../util/index.mjs";

export const {
  console: { info: logInfo, warn: logWarning, error: logError },
} = globalThis;
