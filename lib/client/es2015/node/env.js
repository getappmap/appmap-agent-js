const global_Reflect_getOwnPropertyDescriptor =
  Reflect.getOwnPropertyDescriptor;
const global_Reflect_apply = Reflect.apply;
const global_String_prototype_toLowerCase = String.prototype.toLowerCase;
const global_RegExp_prototype_test = RegExp.prototype.test;
const global_parseInt = parseInt;
const global_String = String;
const global_undefined = undefined;
const global_Object_assign = Object.assign;

const identity = (any) => any;

const parseBoolean = (string) =>
  global_Reflect_apply(global_String_prototype_toLowerCase, string, []) ===
  "true";

const namings = [
  ["APPMAP_PROTOCOL", "protocol", "inline", identity, identity],
  ["APPMAP_HOST", "host", "localhost", identity, identity],
  [
    "APPMAP_PORT",
    "port",
    0,
    (string) => {
      if (
        global_Reflect_apply(global_RegExp_prototype_test, /^[0-9]+$/, [string])
      ) {
        return global_parseInt(string);
      }
      return string;
    },
    global_String,
  ],
  [
    "APPMAP_HOOK_CHILD_PROCESS",
    "hook-child-process",
    false,
    parseBoolean,
    global_String,
  ],
];

exports.extractOptions = (env) => {
  const options = { __proto__: null };
  for (let index = 0; index < namings.length; index += 1) {
    const { 0: key1, 1: key2, 2: def, 3: parse } = namings[index];
    if (
      global_Reflect_getOwnPropertyDescriptor(env, key1) === global_undefined
    ) {
      options[key2] = def;
    } else {
      options[key2] = parse(env[key1]);
      delete env[key1];
    }
  }
  return options;
};

exports.combineOptions = (env, options) => {
  env = global_Object_assign({ __proto__: null }, env);
  for (let index = 0; index < namings.length; index += 1) {
    const { 0: key1, 1: key2, 4: stringify } = namings[index];
    env[key1] = stringify(options[key2]);
  }
  return env;
};
