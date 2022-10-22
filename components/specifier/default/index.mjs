const { URL, Error, Map, RegExp } = globalThis;

const { search: __search } = new URL(import.meta.url);

import Minimatch from "minimatch";
const { logDebug } = await import(`../../log/index.mjs${__search}`);
const { expect } = await import(`../../expect/index.mjs${__search}`);
const { assert } = await import(`../../util/index.mjs${__search}`);
const { toRelativeUrl } = await import(`../../url/index.mjs${__search}`);
const { expectSuccess } = await import(`../../expect/index.mjs${__search}`);

const { Minimatch: MinimatchClass } = Minimatch;

const regexps = new Map();

const makeRegExp = (source, flags) => {
  const key = `/${source}/${flags}`;
  if (regexps.has(key)) {
    return regexps.get(key);
  } else {
    const regexp = expectSuccess(
      () => new RegExp(source, flags),
      "failed to compile regexp source = %j flags = %j >> %O",
      source,
      flags,
    );
    regexps.set(key, regexp);
    return regexp;
  }
};

const escape = (char) => `\\${char}`;

const sanitizeForRegExp = (string) =>
  string.replace(/[/\\+*?.^$()[\]{}|]/gu, escape);

// const sanitizeForGlob = (string) => string.replace(/[*?[\]]/g, escape);

export const createSpecifier = (options, base) => {
  const { glob, path, dist, regexp, flags, recursive, external } = {
    glob: null,
    path: null,
    dist: null,
    regexp: null,
    flags: "",
    recursive: true,
    external: false,
    ...options,
  };
  if (regexp !== null) {
    return {
      base,
      source: regexp,
      flags,
    };
  }
  if (glob !== null) {
    const { source, flags } = new MinimatchClass(glob).makeRe();
    return {
      base,
      source,
      flags,
    };
  }
  if (path !== null) {
    assert(
      path[path.length - 1] !== "/",
      "directory path should not end with a path separator",
    );
    return {
      base,
      source: `^${sanitizeForRegExp(path)}($|/${recursive ? "" : "[^/]*$"})`,
      flags: "",
    };
  }
  if (dist !== null) {
    assert(
      dist[dist.length - 1] !== "/",
      "package path should not end with a path separator",
    );
    let source = `node_modules/${sanitizeForRegExp(dist)}/`;
    if (!external) {
      source = `^${source}`;
    }
    if (!recursive) {
      source = `${source}[^/]*$`;
    }
    return {
      base,
      source,
      flags: "",
    };
  }
  throw new Error("invalid specifier options");
};

// We escape as few character as possible to hide the fact that configuration fields are urls rather than paths.
const escaping = {
  __proto__: null,
  "/": "%2F",
  "?": "%3F",
  "#": "%23",
};

const escapeCharacter = (match) => escaping[match];

const escapeSegment = (segment) => segment.replace(/[/#?]/gu, escapeCharacter);

export const matchSpecifier = (specifier, url) => {
  const { base, source, flags } = specifier;
  const relative = toRelativeUrl(url, base, escapeSegment);
  expect(relative !== null, "could not express %j relatively to %j", url, base);
  const matched = makeRegExp(source, flags).test(relative);
  logDebug(
    "url %j which resolves to %j relatively to %j %s regexp specifier %j with flags %j",
    url,
    relative,
    base,
    matched ? "matched" : "did not match",
    source,
    flags,
  );
  return matched;
};
