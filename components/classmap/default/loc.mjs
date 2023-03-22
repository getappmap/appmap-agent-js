// NB: location is already used -- cf: components/location
import { convertFileUrlToPath } from "../../path/index.mjs";
import { URL } from "../../url/index.mjs";
import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

const { parseInt, String } = globalThis;

export const stringifyLoc = (specifier, line) => {
  if (specifier.startsWith("file://")) {
    const { search, hash } = new URL(specifier);
    return `${convertFileUrlToPath(specifier)}${search}${hash}:${String(line)}`;
  } else {
    return `${specifier}:${String(line)}`;
  }
};

export const parseLoc = (loc) => {
  const parts = /^(.*):([0-9]+)$/u.exec(loc);
  assert(
    parts !== null,
    "could not parse function classmap entity loc",
    InternalAppmapError,
  );
  return {
    path: parts[1],
    lineno: parseInt(parts[2]),
  };
};
