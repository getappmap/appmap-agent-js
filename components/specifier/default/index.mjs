import Minimatch from "minimatch";

const _Map = Map;
const _undefined = undefined;
const _RegExp = RegExp;
const { Minimatch: MinimatchClass } = Minimatch;

export default (dependencies) => {
  const {
    util: { assert },
    path: { toRelativePath, joinPath },
    expect: { expectSuccess },
  } = dependencies;

  const regexps = new _Map();

  const escape = (char) => `\\${char}`;

  const sanitizeForRegExp = (string) =>
    string.replace(/[/\\+*?.^$()[\]{}|]/g, escape);

  // const sanitizeForGlob = (string) => string.replace(/[*?[\]]/g, escape);

  return {
    createSpecifier: (cwd, options) => {
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
      // Hacky way to get the platform-sepecific path separator...
      // But I want to encourage using path methods by not exposing the path separator.
      const path_separator = joinPath("", "");
      if (regexp !== null) {
        return {
          cwd,
          source: regexp,
          flags,
        };
      }
      if (glob !== null) {
        const { source, flags } = new MinimatchClass(glob).makeRe();
        return {
          cwd,
          source,
          flags,
        };
      }
      if (path !== null) {
        assert(
          path[path.length - 1] !== path_separator,
          "directory path should not end with a path separator",
        );
        return {
          cwd,
          source: `^${sanitizeForRegExp(path)}($|\\${path_separator}${
            recursive ? "" : `[^\\${path_separator}]*$`
          })`,
          flags: "",
        };
      }
      if (dist !== null) {
        assert(
          dist[dist.length - 1] !== path_separator,
          "package path should not end with a path separator",
        );
        let source = joinPath("node_modules", sanitizeForRegExp(dist));
        source = joinPath(source, "");
        if (!external) {
          source = `^${source}`;
        }
        if (!recursive) {
          source = `${source}[^\\${path_separator}]*$`;
        }
        return {
          cwd,
          source,
          flags: "",
        };
      }
      assert(false, "invalid specifier options");
    },
    matchSpecifier: (specifier, path) => {
      const { cwd, source, flags } = specifier;
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
      return regexp.test(toRelativePath(cwd, path));
    },
  };
};
