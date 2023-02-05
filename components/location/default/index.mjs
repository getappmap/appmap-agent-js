import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";

const { String, parseInt } = globalThis;

const regexp = /^([\s\S]+)#([0-9]+)-([0-9]+)$/u;

export const stringifyLocation = ({ url, hash, line, column }) => {
  // Prefer hash location over url location to support dynamic sources.
  if (hash !== null) {
    return `${hash}#${String(line)}-${String(column)}`;
  } else if (url !== null) {
    return `${url}#${String(line)}-${String(column)}`;
  } else {
    throw new InternalAppmapError(
      "location should be either url-based or hash-based",
    );
  }
};

export const parseLocation = (string) => {
  const parts = regexp.exec(string);
  assert(parts !== null, "invalid location format", InternalAppmapError);
  // Hash is base64-encoded and cannot contain `:`.
  const is_url_based = parts[1].includes(":");
  return {
    url: is_url_based ? parts[1] : null,
    hash: is_url_based ? null : parts[1],
    line: parseInt(parts[2]),
    column: parseInt(parts[3]),
  };
};
