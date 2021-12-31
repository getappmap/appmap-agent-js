import { createRequire } from "module";

export default (dependencies) => {
  const {
    log: { logWarning },
    url: { appendURLSegment },
  } = dependencies;
  return {
    requireMaybe: (enabled, directory, name) => {
      if (!enabled) {
        return null;
      }
      const require = createRequire(
        new URL(appendURLSegment(directory, "dummy.js")),
      );
      try {
        return require(name);
      } catch (error) {
        logWarning("Could not load %j from %j", name, directory);
        return null;
      }
    },
  };
};
