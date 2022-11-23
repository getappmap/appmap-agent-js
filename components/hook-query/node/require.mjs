const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { createRequire } from "module";
import { logWarning } from "../../log/index.mjs";

export const requireMaybe = (enabled, directory, name) => {
  if (!enabled) {
    return null;
  }
  try {
    return createRequire(new URL(directory))(name);
  } catch (error) {
    logWarning("Could not load %j from %j >> %O", name, directory, error);
    return null;
  }
};
