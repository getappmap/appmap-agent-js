import Minimatch from "minimatch";
import { assert } from "./basic/index.mjs";

const global_RegExp = RegExp;

const escape = (char) => `\\${char}`;

const sanitize = (string) => string.replace(/[/\\+*?.^$()[\]{}|]/gu, escape);

export const makePathSpecifier = (path, options) => ({
  recursive: true,
  ...options,
  path,
});

export const makeDistSpecifier = (dist, options) => ({
  recursive: true,
  external: false,
  ...options,
  dist,
});

export const makeRegExpSpecifier = (pattern, options) => ({
  flags: "",
  ...options,
  pattern,
});

export const makeGlobSpecifier = (glob) => ({ glob });

export const convertSpecifierToRegExp = (specifier) => {
  const { glob, path, dist, pattern, flags, recursive, external } = {
    glob: null,
    path: null,
    dist: null,
    pattern: null,
    flags: "",
    recursive: true,
    external: false,
    ...specifier,
  };
  if (pattern !== null) {
    return new global_RegExp(pattern, flags);
  }
  if (glob !== null) {
    return Minimatch.makeRe(glob);
  }
  if (path !== null) {
    return new RegExp(
      `^${sanitize(path)}($|/${recursive ? "" : "[^/]*$"})`,
      "u",
    );
  }
  if (dist !== null) {
    return new RegExp(
      `${external ? "/" : "^"}node_modules/${sanitize(dist)}/${
        recursive ? "" : "[^/]*$"
      }`,
      "u",
    );
  }
  /* c8 ignore start */
  assert(false, "invalid specifier");
  /* c8 ignore stop */
};
