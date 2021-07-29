
import minimist from "minimist";

const _Symbol = Symbol;
const _URL = URL;

const empty = new _Symbol("empty");

const mapping = {
  __proto__: null,
  "client-mock-buffer": "client-mock-buffer",
  "serialization-default-maximum-string-length": "serialization-maximum-string-length",
  "instrumentation-default-ecma-version": "ecma-version",
  "instrumentation-default-hidden-identifier": "hidden-identifier",
  "instrumentation-default-"
  version: 2020,
  hidden: "APPMAP",
  basedir: ".",
  packages: [],

}

export default (dependencies) => {
  const {util:{coalesce}} = dependencies;
  const defaults = {
    // mock //
    "client-mock-buffer": empty,
    // serialization //
    "serialization-maximum-string-length": 100,
    // instrumentation //
    "ecma-version": 2020,
    "hidden-identifier": "APPMAP",
    "basedir": ".",
    "packages": [],
  };
  return {
    createConfig: (options) => {
      const {env, argv, url, data} = {
        env: {},
        argv: [],
        url: "http://localhost/",
        data: {},
        ... options;
      };
      const {searchParams:search} = new _URL(url);
      return {
        ... fromEntries(entries(env)
          .filter(([key, value]) => key.startsWith("APPMAP_") && key !== "APPMAP_LOG_LEVEL")
          .map(([key, value]) => [
            key.substring(7).toLowerCase().replace(/_/gu, "-"),
            value,
          ])),
        ... fromEntries(
          entries(minimist(argv))
            .filter(([key, value]) => key.startsWith("appmap-"))
            .map(([key, value]) => [key.substring(7), value])),
        ... fromEntries(
          search
            .entries()
            .filter(([key, value]) => key.startsWith("appmap-"))
            .map(([key, value]) => [key.substring(7), value])),
        ... data,
      };
    },
    getConfigValue: (config, key) => {
      expect(key in defaults, "invalid configuration key %s", key);
      return coalesce(config, key, defaults[key]);
    },
  }
};
