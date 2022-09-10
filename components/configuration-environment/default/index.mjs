const {JSON:{ parse: parseJSON }} = globalThis;

export default (dependencies) => {
  const {
    util: { hasOwnProperty },
    validate: { validateInternalConfiguration },
    expect: { expect, expectSuccess },
  } = dependencies;

  return {
    loadEnvironmentConfiguration: (env) => {
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
    },
  };
};
