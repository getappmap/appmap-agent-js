import { readFile as readFileAsync } from "node:fs/promises";
import { hasOwnProperty } from "../../util/index.mjs";
import { getLastUrlExtension } from "../../url/index.mjs";
import { parse as parseYaml } from "yaml";

const {
  URL,
  JSON: { parse: parseJson },
} = globalThis;

const loadJsonAsync = async (url) =>
  parseJson(await readFileAsync(new URL(url), "utf8"));

const loadYamlAsync = async (url) =>
  parseYaml(await readFileAsync(new URL(url), "utf8"));

const loaders = {
  ".json": loadJsonAsync,
  ".yaml": loadYamlAsync,
  ".yml": loadYamlAsync,
};

export const loadAsync = async (url) => {
  const extension = getLastUrlExtension(url);
  if (hasOwnProperty(loaders, extension)) {
    return await loaders[extension](url);
  } else {
    // Can load both cjs and esm modules
    // cf: https://nodejs.org/api/packages.html#packagejson-and-file-extensions
    // Currently, we do not support typescript.
    return (await import(url)).default;
  }
};

export const isLoadMissingError = (error) =>
  hasOwnProperty(error, "code") &&
  (error.code === "ENOENT" ||
    error.code === "ERR_MODULE_NOT_FOUND" ||
    error.code === "MODULE_NOT_FOUND");
