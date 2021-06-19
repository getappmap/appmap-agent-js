const { expect, expectSuccess } = require("../check.js");

const global_JSON_parse = JSON.parse;
const global_Reflect_apply = Reflect.apply;
const global_Reflect_ownKeys = Reflect.ownKeys;
const global_String_prototype_toLowerCase = String.prototype.toLowerCase;
const global_String_prototype_trim = String.prototype.trim;
const global_String_prototype_split = String.prototype.split;
const global_String_prototype_startsWith = String.prototype.startsWith;
const global_Array_prototype_map = Array.prototype.map;
const global_RegExp_prototype_test = RegExp.prototype.test;
const global_parseInt = parseInt;
const global_Object_assign = Object.assign;

const identity = (any) => any;

const empty = [];
const coma = [","];

const toLowerCase = (string) =>
  global_Reflect_apply(global_String_prototype_toLowerCase, string, empty);

const startsWith = (string, prefix) =>
  global_Reflect_apply(global_String_prototype_startsWith, string, [prefix]);

const trim = (string) =>
  global_Reflect_apply(global_String_prototype_trim, string, empty);

const splitComa = (string) =>
  global_Reflect_apply(global_String_prototype_split, string, coma);

const parseBoolean = (string) => toLowerCase(string) === "true";

const parseArrayArgs = [trim];
const parseArray = (string) =>
  global_Reflect_apply(
    global_Array_prototype_map,
    splitComa(string),
    parseArrayArgs
  );

const parsePort = (string) => {
  if (
    global_Reflect_apply(global_RegExp_prototype_test, /^[0-9]+$/, [string])
  ) {
    return global_parseInt(string, 10);
  }
  return string;
};

const parseConfiguration = (string) =>
  expectSuccess(
    () => global_JSON_parse(string),
    "cannot parse as JSON the APPMAP_CONFIGURATION variable: %j",
    string
  );

const parseOutputDirectory = (string) => ({
  directory: string,
});

const parseOutputFileName = (string) => ({
  "file-name": string,
});

const overwrite = (object, key, value) => {
  object[key] = value;
};

const assign = (object, key, value) => {
  object[key] = global_Object_assign({}, object[key], value);
};

const mapping = {
  __proto__: null,
  APPMAP_HOST: ["host", overwrite, identity],
  APPMAP_PORT: ["port", overwrite, parsePort],
  APPMAP_PROTOCOL: ["protocol", overwrite, identity],
  APPMAP: [
    "enabled",
    overwrite,
    (string) => {
      if (toLowerCase(string) === "true") {
        return true;
      }
      if (toLowerCase(string) === "false") {
        return false;
      }
      return parseArray(string);
    },
  ],
  APPMAP_CONFIGURATION: ["extends", overwrite, parseConfiguration],
  APPMAP_CLASS_MAP_PRUNING: ["class-map-pruning", overwrite, parseBoolean],
  APPMAP_EVENT_PRUNING: ["event-pruning", overwrite, parseBoolean],
  APPMAP_ESCAPE_PREFIX: ["escape-prefix", overwrite, identity],
  APPMAP_OUTPUT_DIRECTORY: ["output", assign, parseOutputDirectory],
  APPMAP_OUTPUT_FILE_NAME: ["output", assign, parseOutputFileName],
  APPMAP_APP_NAME: ["app-name", overwrite, identity],
  APPMAP_MAP_NAME: ["map-name", overwrite, identity],
  APPMAP_BASE_DIRECTORY: ["base", overwrite, identity],
  APPMAP_PACKAGES: ["packages", overwrite, parseArray],
  APPMAP_EXCLUDE: ["exclude", overwrite, parseArray],
  APPMAP_HOOK_CJS: ["hook-cjs", overwrite, parseBoolean],
  APPMAP_HOOK_ESM: ["hook-esm", overwrite, parseBoolean],
  APPMAP_HOOK_HTTP: ["hook-http", overwrite, parseBoolean],
};

exports.makeOptions = (process) => {
  const data = {
    __proto__: null,
    protocol: "inline",
    host: "localhost",
    port: 0,
    main: {
      path: process.argv[1],
    },
    engine: {
      name: "node",
      version: process.versions.node,
    },
  };
  const variables = global_Reflect_ownKeys(process.env);
  for (let index = 0; index < variables.length; index += 1) {
    const variable = variables[index];
    if (startsWith(variable, "APPMAP")) {
      expect(
        variable in mapping,
        `invalid appmap environment variable: %j`,
        variable
      );
      const { 0: key, 1: merge, 2: transform } = mapping[variable];
      merge(data, key, transform(process.env[variable]));
    }
  }
  const { protocol, port, host } = data;
  delete data.protocol;
  delete data.host;
  delete data.port;
  data.cwd = process.cwd();
  return {
    protocol,
    host,
    port,
    configuration: data,
  };
};
