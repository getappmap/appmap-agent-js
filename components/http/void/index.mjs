const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { InternalAppmapError } from "../../error/index.mjs";
import { generateDeadcode } from "../../util/index.mjs";

export const requestAsync = generateDeadcode(
  "requestAsync should not be called on http/void",
  InternalAppmapError,
);

export const generateRespond = generateDeadcode(
  "requestAsync should not be called on http/void",
  generateDeadcode,
);
