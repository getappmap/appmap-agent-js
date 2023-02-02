import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";

const { String, parseInt } = globalThis;

const regexp = /^([\s\S]+)#([0-9]+)-([0-9]+)$/u;

export const stringifyLocation = ({ url, hash, line, column }) =>
  // Prefer hash location over url location to support dynamic sources.
  `${hash === null ? url : hash}#${String(line)}-${String(column)}`;

export const parseLocation = (string) => {
  const parts = regexp.exec(string);
  assert(parts !== null, InternalAppmapError, "invalid location format");
  // Hash is base64-encoded and cannot contain `:`.
  const is_url_based = parts[1].includes(":");
  return {
    url: is_url_based ? parts[1] : null,
    hash: is_url_based ? null : parts[1],
    line: parseInt(parts[2]),
    column: parseInt(parts[3]),
  };
};
