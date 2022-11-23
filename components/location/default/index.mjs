const { URL, String, parseInt } = globalThis;

import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";

export const makeLocation = (url, { line, column }) =>
  new URL(`#${String(line)}-${String(column)}`, url).toString();

export const getLocationPosition = (url) => {
  const { hash } = new URL(url);
  const parts = /^#([0-9]+)-([0-9]+)$/u.exec(hash);
  assert(parts !== null, "expected a url code location", InternalAppmapError);
  return {
    line: parseInt(parts[1]),
    column: parseInt(parts[2]),
  };
};

export const getLocationBase = (url) => {
  const object_url = new URL(url);
  object_url.hash = "";
  return object_url.toString();
};
