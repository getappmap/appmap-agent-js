const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

import { noop } from "../../util/index.mjs";

export const logDebug = noop;

export const logInfo = noop;

export const logWarning = noop;

export const logError = noop;
