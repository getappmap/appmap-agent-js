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
      const url = new URL(appendURLSegment(directory, "dummy.js"));
      try {
        return createRequire(url)(name);
      } catch (error) {
        logWarning("Could not load %j from %j >> %O", name, directory, error);
        return null;
      }
    },
  };
};
