import { createRequire } from "node:module";
import { InternalAppmapError } from "../../error/index.mjs";
import { logError } from "../../log/index.mjs";

const version = "1.8.0";

let validate = null;

export const validateAppmap = (data) => {
  if (validate === null) {
    // Dynamic import on demand for performance
    const require = createRequire(import.meta.url);
    ({ validate } = require("@appland/appmap-validate"));
  }
  try {
    validate(data, { version });
  } catch (error) {
    logError("Invalid %s appmap >> %O\n>>%j", version, error, data);
    throw new InternalAppmapError("Invalid appmap");
  }
};
