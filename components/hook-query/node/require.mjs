const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { createRequire } from "module";
const { logWarning } = await import(`../../log/index.mjs${__search}`);

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
