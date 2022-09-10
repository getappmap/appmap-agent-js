const { undefined } = globalThis;

export default (dependencies) => {
  const {
    expect: { expect },
    util: { coalesce, matchVersion },
  } = dependencies;
  return {
    validateMocha: (Mocha) => {
      const prototype = coalesce(Mocha, "prototype", undefined);
      const version = coalesce(prototype, "version", undefined);
      expect(
        typeof version === "string",
        "Mocha.prototype.version should be a string but got: %o.",
        version,
      );
      expect(
        matchVersion(version, "8.0.0"),
        "Expected Mocha.prototype.version >= 8.0.0 but got: %o",
        version,
      );
    },
  };
};
