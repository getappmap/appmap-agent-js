const global_Reflect_apply = Reflect.apply;

const global_Reflect_ownKeys = Reflect.ownKeys;
const global_String_prototype_toLowerCase = String.prototype.toLowerCase;
const global_String_prototype_trim = String.prototype.trim;
const global_String_prototype_split = String.prototype.split;
const global_String_prototype_startsWith = String.prototype.startsWith;
const global_Array_prototype_map = Array.prototype.map;
const global_Error = Error;

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

exports.parseBoolean = parseBoolean;

const mapping = {
  __proto__: null,
  APPMAP: [
    "enabled",
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
  APPMAP_RC_FILE: ["extends", identity],
  APPMAP_CLASS_MAP_PRUNING: ["class-map-pruning", parseBoolean],
  APPMAP_EVENTS_PRUNING: ["events-pruning", parseBoolean],
  APPMAP_ESCAPE_PREFIX: ["escape-prefix", identity],
  APPMAP_OUTPUT_DIRECTORY: ["output-directory", identity],
  APPMAP_OUTPUT_FILE_NAME: ["output-file-name", identity],
  APPMAP_MAIN_PATH: ["main-path", identity],
  APPMAP_APP_NAME: ["app-name", identity],
  APPMAP_MAP_NAME: ["map-name", identity],
  APPMAP_BASE_DIRECTORY: ["base-dir", identity],
  APPMAP_FEATURE: ["feature", identity],
  APPMAP_FEATURE_GROUP: ["feature-group", identity],
  APPMAP_LABELS: ["labels", parseArray],
  APPMAP_RECORDER_NAME: ["recorder-name", identity],
  APPMAP_RECORDING_DEFINED_CLASS: ["recording-defined-class", identity],
  APPMAP_RECORDING_METHOD_ID: ["recording-method-id", identity],
  APPMAP_FRAMEWORKS: ["frameworks", parseArray],
  APPMAP_LANGUAGE_ENGINE: ["language-engine", identity],
  APPMAP_LANGUAGE_VERSION: ["language-version", identity],
  APPMAP_PACKAGES: ["packages", parseArray],
  APPMAP_EXCLUDE: ["exclude", parseArray],
};

exports.parseConfigurationData = (env) => {
  const keys = global_Reflect_ownKeys(env);
  const data = { __proto__: null };
  for (let index = 0; index < keys.length; index += 1) {
    if (startsWith(keys[index], "APPMAP")) {
      if (!(keys[index] in mapping)) {
        throw new global_Error(
          `invalid appmap environment variable: ${keys[index]}`
        );
      }
      const { 0: key, 1: transformer } = mapping[keys[index]];
      data[key] = transformer(env[keys[index]]);
    }
  }
  return data;
};
