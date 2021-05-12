import * as Path from 'path';
import * as Minimatch from 'minimatch';
import { assert } from '../assert.mjs';
import { resolvePath } from './cwd.mjs';

const options = {
  nocomment: true,
};

const cache = new Map();

export const lookupNormalizedSpecifierArray = (specifiers, path, placeholder) => {
  assert(Path.isAbsolute(path), 'expected an absolute path, got: %o', path);
  for (let index = 0; index < specifiers.length; index += 1) {
    const { base, pattern, flags, data } = specifiers[index];
    const key = `${pattern}|${flags}`;
    let regexp = cache.get(key);
    if (regexp === undefined) {
      regexp = new RegExp(pattern, flags);
      cache.set(key, regexp);
    }
    if (regexp.test(Path.relative(base, path))) {
      return data;
    }
  }
  return placeholder;
};

export const normalizeSpecifier = (specifier) => {
  if (typeof specifier === 'string') {
    specifier = { glob: specifier };
  }
  if (Reflect.getOwnPropertyDescriptor(specifier, "base") !== undefined) {
    return specifier;
  }
  specifier = {
    glob: null,
    path: null,
    dist: null,
    pattern: null,
    flags: "",
    recursive: false,
    nested: false,
    external: false,
    enabled: true,
    shallow: false,
    exclude: [],
    ...specifier,
  };
  const base = resolvePath('.');
  const data = {
    enabled: specifier.enabled,
    shallow: specifier.shallow,
    exclude: specifier.exclude
  };
  if (specifier.pattern !== null) {
    return [{
      base,
      pattern: specifier.pattern,
      flags: specifier.flags,
      data,
    }];
  }
  const globs = [];
  if (specifier.glob !== null) {
    globs.push(specifier.glob);
  } else if (specifier.path !== null) {
    let glob = specifier.path;
    if (!/\.[a-zA-Z0-9]+$/u.test(glob)) {
      if (!glob.endsWith('/')) {
        glob = `${glob}/`;
      }
      if (specifier.recursive) {
        glob = `${glob}**/`;
      }
      glob = `${glob}*`;
    }
    globs.push(glob);
  } else if (specifier.dist !== null) {
    let glob = `node_module/${specifier.dist}`;
    if (specifier.nested) {
      glob = `**/${glob}`;
    }
    if (specifier.recursive) {
      glob = `${glob}/**`;
    }
    glob = `${glob}/*`;
    if (specifier.external) {
      const depth = base.split('/').length - 1;
      for (let index = 0; index <= depth; index += 1) {
        globs.push(`${'../'.repeat(index)}${glob}`);
      }
    } else {
      globs.push(glob);
    }
  }
  return globs.map((glob) => {
    const regexp = (new Minimatch.Minimatch(glob, options)).makeRe();
    return {
      base,
      pattern: regexp.source,
      flags: regexp.flags,
      data
    };
  });
};
