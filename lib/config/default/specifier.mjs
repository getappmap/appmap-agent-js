import Minimatch from "minimatch";

const _Map = Map;
const _undefined = undefined;
const _RegExp = RegExp;
const { Minimatch: MinimatchClass } = Minimatch;

export default (dependencies) => {
  const {
    assert: { assert },
    util: { relativizePath },
  } = dependencies;

  const regexps = new _Map();

  const escape = (char) => `\\${char}`;

  const sanitizeForRegExp = (string) =>
    string.replace(/[/\\+*?.^$()[\]{}|]/g, escape);

  // const sanitizeForGlob = (string) => string.replace(/[*?[\]]/g, escape);

  return {
    createSpecifier: (basedir, options) => {
      const { glob, path, dist, pattern, flags, recursive, external } = {
        glob: null,
        path: null,
        dist: null,
        pattern: null,
        flags: "",
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
        const { source: pattern, flags } = new MinimatchClass(glob).makeRe();
        return {
          basedir,
          pattern,
          flags,
        };
      }
      if (path !== null) {
        assert(
          path[path.length - 1] !== "/",
          "directory path should not end with '/', got: %j",
          path,
        );
        return {
          basedir,
          pattern: `^${sanitizeForRegExp(path)}($|/${
            recursive ? "" : "[^/]*$"
          })`,
          flags: "",
        };
      }
      if (dist !== null) {
        assert(
          dist[dist.length - 1] !== "/",
          "package path should not end with '/', got: %j",
          path,
        );
        let pattern = `node_modules/${sanitizeForRegExp(dist)}/`;
        if (!external) {
          pattern = `^${pattern}`;
        }
        if (!recursive) {
          pattern = `${pattern}[^/]*$`;
        }
        return {
          basedir,
          pattern,
          flags: "",
        };
      }
      assert(false, "invalid specifier options: %j", options);
    },
    matchSpecifier: ({ basedir, pattern, flags }, path) => {
      const key = `/${pattern}/${flags}`;
      let regexp = regexps.get(key);
      if (regexp === _undefined) {
        regexp = new _RegExp(pattern, flags);
        regexps.set(key, regexp);
      }
      return regexp.test(relativizePath(basedir, path));
    },
  };
};
