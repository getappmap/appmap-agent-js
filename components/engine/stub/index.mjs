const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

import { constant } from "../../util/index.mjs";
export const getEngine = constant("engine@0.0.0");
