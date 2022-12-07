import { InternalAppmapError } from "../../error/index.mjs";
import { assert, hasOwnProperty } from "../../util/index.mjs";
import { validateInternalConfiguration } from "../../validate/index.mjs";

const {
  JSON: { parse: parseJSON },
} = globalThis;

export const loadEnvironmentConfiguration = (env) => {
  assert(
    hasOwnProperty(env, "APPMAP_CONFIGURATION"),
    "Missing 'APPMAP_CONFIGURATION' environment variable",
    InternalAppmapError,
  );
  const { APPMAP_CONFIGURATION: content } = env;
  const configuration = parseJSON(content);
  validateInternalConfiguration(configuration);
  return configuration;
};
