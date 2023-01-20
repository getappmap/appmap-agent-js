import { readFile as readFileAsync } from "node:fs/promises";
import { createRequire } from "node:module";
import { hasOwnProperty } from "../../util/index.mjs";
import { logError } from "../../log/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { self_directory } from "../../self/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { getUrlFilename, toAbsoluteUrl } from "../../url/index.mjs";

const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

// The location of require does not matter because it will only load file urls.
const require = createRequire(self_directory);

const loadConfigModuleAsync = async (url) => {
  if (getUrlFilename(url).endsWith(".mjs")) {
    return (await import(new URL(url))).default;
  } else {
    return require(convertFileUrlToPath(url));
  }
};

const loadConfigFileAsync = async (url, strict) => {
  try {
    if (getUrlFilename(url).endsWith(".json")) {
      return parseJSON(await readFileAsync(new URL(url), "utf8"));
    } else {
      const config = await loadConfigModuleAsync(url);
      if (typeof config === "function") {
        return await config();
      } else {
        return config;
      }
    }
  } catch (error) {
    if (
      hasOwnProperty(error, "code") &&
      (error.code === "ENOENT" ||
        error.code === "ERR_MODULE_NOT_FOUND" ||
        error.code === "MODULE_NOT_FOUND")
    ) {
      if (strict) {
        logError("Cannot find jest configuration file at %j", url);
        throw new ExternalAppmapError("Cannot find jest configuration file");
      } else {
        return null;
      }
    } else {
      logError(
        "Failed to load jest configuration file at %j >> %O",
        url,
        error,
      );
      throw new ExternalAppmapError("Failed to load jest configuration file");
    }
  }
};

const loadPackageAsync = async (directory) => {
  try {
    return parseJSON(
      await readFileAsync(
        new URL(toAbsoluteUrl("package.json", directory)),
        "utf8",
      ),
    );
  } catch (error) {
    if (hasOwnProperty(error, "code") && error.code === "ENOENT") {
      return null;
    } else {
      logError("Could not load package.json from %j >> %O", directory, error);
      throw new ExternalAppmapError("Could not load package.json");
    }
  }
};

export const loadJestConfigAsync = async (options, { root, base }) => {
  if (hasOwnProperty(options, "config")) {
    return await loadConfigFileAsync(toAbsoluteUrl(options.config, base), true);
  } else {
    const { jest: maybe_package_config } = {
      jest: null,
      ...(await loadPackageAsync(root)),
    };
    if (maybe_package_config !== null) {
      return maybe_package_config;
    } else {
      for (const extension of [".ts", ".js", ".cjs", ".mjs", ".json"]) {
        const maybe_config = await loadConfigFileAsync(
          toAbsoluteUrl(`jest.config${extension}`, root),
          false,
        );
        if (maybe_config !== null) {
          return maybe_config;
        }
      }
      return {};
    }
  }
};
