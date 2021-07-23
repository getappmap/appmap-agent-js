
import Minimatch from 'minimatch';
import { assert } from '../assert.mjs';
import { resolvePath } from './cwd.mjs';
import { getParseRegExp } from '../regexp-cache.mjs';

const _Map = Map;
const {Minimatch:MinimatchClass} = Minimatch;

export default (dependencies) => {

  const regexps = new _Map();

  const escape = (char) => `\\${char}`;

  const sanitizeForRegExp = (string) =>
    string.replace(/[/\\+*?.^$()[\]{}|]/g, escape);

  const sanitizeForGlob = (string) => string.replace(/[*?[\]]/g, escape);

  const {
    createSpecifier: (basedir, options) => {
      const {
        glob,
        path,
        dist,
        pattern,
        flags,
        recursive,
        nested,
        externs,
      } = {
        glob: null,
        path: null,
        dist: null,
        pattern: null,
        flags: '',
        recursive: false,
        nested: false,
        external: false,
        ...options,
      };
      if (pattern !== null) {
        return {
          basedir,
          pattern,
          flags,
        };
      }
      if (glob !== null) {
        const {source, flags} = new MinimatchClass(
          sanitizeForGlob(glob),
          options,
        ).makeRe();
        return {
          basedir,
          pattern,
          flags,
        };
      }
      if (path !== null) {
        return {
          basedir,
          pattern: `^${sanitizeForRegExp(path)}($|/${recursive ? '' : '[^/]*$'})`,
          flags: '',
        };
      }
      if (dist !== null) {
        let pattern = `/node_modules/${sanitizeForRegExp(dist)}/`;
        if (!external) {
          pattern = `^${pattern}`;
        }
        if (!recursive) {
          pattern = `${pattern}[^/]*$`;
        }
        return {
          basedir,
          pattern,
          flags: '',
        };
      }
      /* c8 ignore start */
      assert(false, 'invalid specifier %o', specifier);
      /* c8 ignore stop */
    };
    matchSpecifier: ({basedir, source, flags}, path) => {
      const key = `/${source}/${flags}`;
      let regexp = regexps.get(key);
      if (regexp === _undefined) {
        regexp = new _RegExp(source, flags);
        regexp.set(key, regexp);
      }
      return regexp.test(getRelativePath(path, basedir));
    },
  };
};
