import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";

const { String, parseInt, undefined } = globalThis;

const regexp = /^([A-Za-z0-9+/=]+\|)?([\s\S]+):([0-9]+):([0-9]+)$/u;

export const stringifyLocation = ({
  url,
  hash,
  position: { line, column },
}) => {
  if (hash === null) {
    return `${url}:${String(line)}:${String(column)}`;
  } else {
    return `${hash}|${url}:${String(line)}:${String(column)}`;
  }
};

export const parseLocation = (string) => {
  const parts = regexp.exec(string);
  assert(parts !== null, "invalid location format", InternalAppmapError);
  return {
    hash:
      parts[1] === undefined
        ? null
        : parts[1].substring(0, parts[1].length - 1),
    url: parts[2],
    position: {
      line: parseInt(parts[3]),
      column: parseInt(parts[4]),
    },
  };
};
