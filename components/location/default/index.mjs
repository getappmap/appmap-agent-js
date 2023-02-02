import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";

const { String, parseInt } = globalThis;

const regexp = /^([\s\S]+)#([0-9]+)-([0-9]+)$/u;

export const stringifyLocation = ({ url, line, column }) =>
  `${url}#${String(line)}-${String(column)}`;

export const parseLocation = (string) => {
  const parts = regexp.exec(string);
  assert(parts !== null, InternalAppmapError, "invalid location format");
  return {
    url: parts[1],
    line: parseInt(parts[2]),
    column: parseInt(parts[3]),
  };
};
