import { createRequire } from "module";

export default (dependencies) => {
  const {
    log: { logWarning },
  } = dependencies;
  return {
    requireMaybe: (enabled, directory, name) => {
      if (!enabled) {
        return null;
      }
      const require = createRequire(`${directory}/dummy.js`);
      try {
        return require(name);
      } catch (error) {
        logWarning("Could not load %j from %j", name, directory);
        return null;
      }
    },
  };
};
