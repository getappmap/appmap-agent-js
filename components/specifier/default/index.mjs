import Minimatch from "minimatch";

const _Map = Map;
const _undefined = undefined;
const _RegExp = RegExp;
const { Minimatch: MinimatchClass } = Minimatch;

export default (dependencies) => {
  const {
    util: { assert, toRelativePath },
    expect: { expectSuccess },
  } = dependencies;

  const regexps = new _Map();

  const escape = (char) => `\\${char}`;

  const sanitizeForRegExp = (string) =>
    string.replace(/[/\\+*?.^$()[\]{}|]/g, escape);

  // const sanitizeForGlob = (string) => string.replace(/[*?[\]]/g, escape);

  return {
    createSpecifier: (basedir, options) => {
      const { glob, path, dist, regexp, flags, recursive, external } = {
        glob: null,
        path: null,
        dist: null,
        regexp: null,
        flags: "",
        recursive: false,
        nested: false,
        external: false,
        ...options,
      };
      if (regexp !== null) {
        return {
          basedir,
          source: regexp,
          flags,
        };
      }
      if (glob !== null) {
        const { source, flags } = new MinimatchClass(glob).makeRe();
        return {
          basedir,
          source,
          flags,
        };
      }
      if (path !== null) {
        assert(
          path[path.length - 1] !== "/",
          "directory path should not end with '/'",
        );
        return {
          basedir,
          source: `^${sanitizeForRegExp(path)}($|/${
            recursive ? "" : "[^/]*$"
          })`,
          flags: "",
        };
      }
      if (dist !== null) {
        assert(
          dist[dist.length - 1] !== "/",
          "package path should not end with '/'",
        );
        let source = `node_modules/${sanitizeForRegExp(dist)}/`;
        if (!external) {
          source = `^${source}`;
        }
        if (!recursive) {
          source = `${source}[^/]*$`;
        }
        return {
          basedir,
          source,
          flags: "",
        };
      }
      assert(false, "invalid specifier options");
    },
    matchSpecifier: (specifier, path) => {
      const { basedir, source, flags } = specifier;
      const key = `/${source}/${flags}`;
      let regexp = regexps.get(key);
      if (regexp === _undefined) {
        regexp = expectSuccess(
          () => new _RegExp(source, flags),
          "failed to compile specifier %j >> %e",
          specifier,
        );
        regexps.set(key, regexp);
      }
      return regexp.test(toRelativePath(basedir, path));
    },
  };
};
