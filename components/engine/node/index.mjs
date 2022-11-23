const {
  process: { version },
} = globalThis;

import { constant } from "../../util/index.mjs";

export const getEngine = constant(`node@${version}`);
