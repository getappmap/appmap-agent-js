import { createRequire } from "node:module";
import { ExternalAppmapError } from "../../error/index.mjs";
import { logError, logDebug } from "../../log/index.mjs";

const { URL } = globalThis;

export const requirePeerDependency = (specifier, { directory, strict }) => {
  const require = createRequire(new URL(directory));
  try {
    return require(specifier);
  } catch (error) {
    if (strict) {
      logError(
        "Could not load peer dependency %j from %j >> %O",
        specifier,
        directory,
        error,
      );
      throw new ExternalAppmapError("Could not load peer dependency");
    } else {
      logDebug(
        "Could not load peer dependency %j from %j >> %O",
        specifier,
        directory,
        error,
      );
      return null;
    }
  }
};
