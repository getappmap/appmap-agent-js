import { compileGlob } from "../../glob/index.mjs";
import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import { logError, logDebug } from "../../log/index.mjs";
import { assert } from "../../util/index.mjs";
import { toRelativeUrl } from "../../url/index.mjs";

const { Map, RegExp } = globalThis;

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

const toTargetRegExp = (target, recursive) => {
  if (recursive) {
    if (target.endsWith("/")) {
      return `^${sanitizeForRegExp(target)}`;
    } else {
      return `^${sanitizeForRegExp(target)}(/|$)`;
    }
  } else {
    if (target.endsWith("/")) {
      return `^${sanitizeForRegExp(target)}[^/]*$`;
    } else {
      return `^${sanitizeForRegExp(target)}$`;
    }
  }
};

export const createSpecifier = (options, base) => {
  const {
    glob,
    url,
    path,
    dist,
    regexp,
    flags,
    recursive,
    external,
    relative,
  } = {
    glob: null,
    path: null,
    url: null,
    dist: null,
    regexp: null,
    flags: "",
    recursive: true,
    external: false,
    relative: true,
    ...options,
  };
  if (regexp !== null) {
    return {
      base: relative ? base : null,
      source: regexp,
      flags,
    };
  }
  if (glob !== null) {
    const { source, flags } = compileGlob(glob);
    return {
      base,
      source,
      flags,
    };
  }
  if (path !== null) {
    return {
      base,
      source: toTargetRegExp(path, recursive),
      flags: "",
    };
  }
  if (url !== null) {
    return {
      base: null,
      source: toTargetRegExp(url, recursive),
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
  if (base === null) {
    const matched = makeRegExpCache(source, flags).test(url);
    logDebug(
      "url %j %s absolute regexp specifier %j with flags %j",
      url,
      matched ? "matched" : "did not match",
      source,
      flags,
    );
    return matched;
  } else {
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
        "url %j which resolves to %j relatively to %j %s relative regexp specifier %j with flags %j",
        url,
        relative,
        base,
        matched ? "matched" : "did not match",
        source,
        flags,
      );
      return matched;
    }
  }
};

export const lookupSpecifier = (entries, url, default_value) => {
  for (const [specifier, value] of entries) {
    if (matchSpecifier(specifier, url)) {
      return value;
    }
  }
  return default_value;
};
