import { readFile as readFileAsync } from "node:fs/promises";
import { createRequire } from "node:module";
import { format, hasOwnProperty, isFileNotFound } from "../../util/index.mjs";
import { logError, logDebug } from "../../log/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { loadAsync, isLoadMissingError } from "../../load/index.mjs";
import { convertPathToFileUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";

const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

const loadConfigFileAsync = async (url, strict) => {
  try {
    return await loadAsync(url);
  } catch (error) {
    if (!strict && isLoadMissingError(error)) {
      return null;
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

const loadPackageJsonAsync = async (directory) => {
  try {
    return parseJSON(
      await readFileAsync(
        new URL(toAbsoluteUrl("package.json", directory)),
        "utf8",
      ),
    );
  } catch (error) {
    if (isFileNotFound(error)) {
      return null;
    } else {
      logError("Could not load package.json from %j >> %O", directory, error);
      throw new ExternalAppmapError(
        format("Could not load package.json (%O)", [error]),
      );
    }
  }
};

export const loadJestConfigAsync = async (options, { root, base }) => {
  if (hasOwnProperty(options, "config")) {
    return await loadConfigFileAsync(toAbsoluteUrl(options.config, base), true);
  } else {
    const { jest: maybe_package_config } = {
      jest: null,
      ...(await loadPackageJsonAsync(root)),
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

const PRESET_FILE_NAME_ARRAY = [
  "jest-preset.json",
  "jest-preset.js",
  "jest-preset.cjs",
  "jest-preset.mjs",
];

const resolvePresetSpecifier = (specifier, root) => {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return toAbsoluteUrl(specifier, root);
  } else {
    const { resolve } = createRequire(new URL(root));
    for (const filename of PRESET_FILE_NAME_ARRAY) {
      const sub_specifier = `${specifier}/${filename}`;
      try {
        return convertPathToFileUrl(resolve(sub_specifier));
      } catch (error) {
        logDebug(
          "Could not resolve jest preset at %j >> %O",
          sub_specifier,
          error,
        );
      }
    }
    logError("Could not resolve jest preset at %j", specifier);
    throw new ExternalAppmapError("Could not resolve jest preset");
  }
};

export const resolveJestPresetAsync = async (config, root) => {
  if (hasOwnProperty(config, "preset")) {
    return {
      ...(await loadConfigFileAsync(
        resolvePresetSpecifier(config.preset, root),
        true,
      )),
      ...config,
      preset: null,
    };
  } else {
    return config;
  }
};
