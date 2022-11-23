const {
  JSON: { parse: parseJSON },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import { InternalAppmapError } from "../../error/index.mjs";
import { assert, hasOwnProperty } from "../../util/index.mjs";
import { validateInternalConfiguration } from "../../validate/index.mjs";

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
