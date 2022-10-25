const {
  JSON: { parse: parseJSON },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { assert, hasOwnProperty } = await import(
  `../../util/index.mjs${__search}`
);
const { validateInternalConfiguration } = await import(
  `../../validate/index.mjs${__search}`
);

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
