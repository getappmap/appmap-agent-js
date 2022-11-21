const { URL, Map, RegExp } = globalThis;

const { search: __search } = new URL(import.meta.url);

import Minimatch from "minimatch";
const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logError, logDebug } = await import(`../../log/index.mjs${__search}`);
const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { assert } = await import(`../../util/index.mjs${__search}`);
const { toRelativeUrl } = await import(`../../url/index.mjs${__search}`);

const { Minimatch: MinimatchClass } = Minimatch;

const regexps = new Map();

const makeRegExp = (source, flags) => {
  try {
    return new RegExp(source, flags);
  } catch (error) {
    logError(
      "Failed to compile regexp source %j with flags %j >> %O",
      source,
      flags,
      error,
    );
    throw new ExternalAppmapError("Failed to compile specifier regexp");
  }
};

const makeRegExpCache = (source, flags) => {
  const key = `/${source}/${flags}`;
  if (regexps.has(key)) {
    return regexps.get(key);
  } else {
    const regexp = makeRegExp(source, flags);
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
      InternalAppmapError,
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
      InternalAppmapError,
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
  throw new InternalAppmapError("invalid specifier options");
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
  if (relative === null) {
    logDebug(
      "could not apply specifier %j because %j cannot be expressed relatively to %j, will treat it as unmatched",
      source,
      url,
      base,
    );
    return false;
  } else {
    const matched = makeRegExpCache(source, flags).test(relative);
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
  }
};
