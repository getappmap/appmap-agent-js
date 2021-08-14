const { parse: parseJSON } = JSON;

export default (dependencies) => {
  const {
    util: { hasOwnProperty },
    log: { logInfo },
    expect: { expect, expectSuccess },
    specifier: { matchSpecifier },
    validate: { validateCookedConfiguration },
    configuration: { extendConfiguration },
  } = dependencies;
  return {
    loadConfiguration: ({ env, argv, cwd }) => {
      expect(
        hasOwnProperty(env, "APPMAP_CONFIGURATION"),
        "missing 'APPMAP_CONFIGURATION' environment variable",
      );
      const { APPMAP_CONFIGURATION: content } = env;
      const configuration = expectSuccess(
        () => parseJSON(content),
        "failed to parse 'APPMAP_CONFIGURATION' environment variable >> %e",
      );
      validateCookedConfiguration(configuration);
      const { length } = argv;
      expect(length > 1, "cannot extract main file from argv: %j", argv);
      const { [1]: main } = argv;
      return extendConfiguration(configuration, { main }, cwd());
    },
    isConfigurationEnabled: ({ enabled, main }) => {
      for (const [specifier, boolean] of enabled) {
        if (matchSpecifier(specifier, main)) {
          logInfo(
            `${boolean ? "recording" : "bypassing"} %s because it matched %j`,
            main,
            specifier,
          );
          return boolean;
        }
      }
      logInfo(
        "bypassing %j because it did not match any specifier in %j",
        main,
        enabled,
      );
      return false;
    },
  };
};
