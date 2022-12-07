import { constant } from "../../util/index.mjs";

const {
  process: { version },
} = globalThis;

export const getEngine = constant(`node@${version}`);
