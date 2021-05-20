import * as Path from 'path';
import * as Minimatch from 'minimatch';
import { assert } from '../assert.mjs';
import { resolvePath } from './cwd.mjs';

const options = {
  nocomment: true,
};

const escape = (char) => `\\${char}`;

const sanitizeForRegExp = (string) =>
  string.replace(/[/\\+*?.^$()[\]{}|]/g, escape);

const sanitizeForGlob = (string) => string.replace(/[*?[\]]/g, escape);

const cache = new Map();

export const lookupNormalizedSpecifierArray = (
  specifiers,
  path,
  placeholder,
) => {
  assert(Path.isAbsolute(path), 'expected an absolute path, got: %o', path);
  for (let index = 0; index < specifiers.length; index += 1) {
    const { pattern, flags, data } = specifiers[index];
    // const xsxss = Path.relative(base, path);
    // console.log("wesh", Path.relative(base, path), glob);
    const key = `${pattern}|${flags}`;
    let regexp = cache.get(key);
    if (regexp === undefined) {
      regexp = new RegExp(pattern, flags);
      cache.set(key, regexp);
    }
    if (regexp.test(path)) {
      return data;
    }
    // const relative = Path.relative(base, path);
    // if (regexp.test(relative)) {
    //   return data;
    // }
  }
  return placeholder;
};

export const normalizeSpecifier = (specifier, data) => {
  if (Reflect.getOwnPropertyDescriptor(specifier, 'data') !== undefined) {
    return specifier;
  }
  specifier = {
    glob: null,
    path: null,
    dist: null,
    pattern: null,
    flags: '',
    recursive: false,
    nested: false,
    external: false,
    ...specifier,
  };
  if (specifier.pattern !== null) {
    return {
      pattern: specifier.pattern,
      flags: specifier.flags,
      data,
    };
  }
  if (specifier.glob !== null) {
    const regexp = new Minimatch.default.Minimatch(
      Path.resolve(sanitizeForGlob(resolvePath('.')), specifier.glob),
      options,
    ).makeRe();
    return {
      pattern: regexp.source,
      flags: regexp.flags,
      data,
    };
  }
  if (specifier.path !== null) {
    return {
      pattern: `^${sanitizeForRegExp(resolvePath(specifier.path))}($|/${
        specifier.recursive ? '' : '[^/]*$'
      })`,
      flags: '',
      data,
    };
  }
  if (specifier.dist !== null) {
    let pattern = `/node_modules/${sanitizeForRegExp(specifier.dist)}/`;
    if (!specifier.external) {
      pattern = `^${sanitizeForRegExp(resolvePath('.'))}${pattern}`;
    }
    if (!specifier.recursive) {
      pattern = `${pattern}[^/]*$`;
    }
    return {
      pattern,
      flags: '',
      data,
    };
  }
  /* c8 ignore start */
  assert(false, 'invalid specifier %o', specifier);
  /* c8 ignore stop */
};
