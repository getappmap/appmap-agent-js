const {
  JSON: { parse: parseJSON },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { hasOwnProperty } = await import(`../../util/index.mjs${__search}`);
const { validateInternalConfiguration } = await import(
  `../../validate/index.mjs${__search}`
);
const { expect, expectSuccess } = await import(
  `../../expect/index.mjs${__search}`
);

export const loadEnvironmentConfiguration = (env) => {
  expect(
    hasOwnProperty(env, "APPMAP_CONFIGURATION"),
    "Missing 'APPMAP_CONFIGURATION' environment variable.",
  );
  const { APPMAP_CONFIGURATION: content } = env;
  const configuration = expectSuccess(
    () => parseJSON(content),
    "failed to parse 'APPMAP_CONFIGURATION' environment variable >> %O",
  );
  validateInternalConfiguration(configuration);
  return configuration;
};
