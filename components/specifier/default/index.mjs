const { URL, Error, Map, RegExp } = globalThis;

const { search: __search } = new URL(import.meta.url);

import Minimatch from "minimatch";
const { logDebug } = await import(`../../log/index.mjs${__search}`);
const { assert } = await import(`../../util/index.mjs${__search}`);
const { pathifyURL } = await import(`../../url/index.mjs${__search}`);
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

export const matchSpecifier = (specifier, url) => {
  if (typeof specifier === "boolean") {
    logDebug(
      "url %j %s constant specifier",
      url,
      specifier ? "matched" : "did not match",
    );
    return specifier;
  } else {
    const { base, source, flags } = specifier;
    const maybe_path = pathifyURL(url, base);
    const matched =
      maybe_path === null ? false : makeRegExp(source, flags).test(maybe_path);
    logDebug(
      "url %j which resolves to %j relatively to %j %s regexp specifier %j with flags %j",
      url,
      maybe_path,
      base,
      matched ? "matched" : "did not match",
      source,
      flags,
    );
    return matched;
  }
};
