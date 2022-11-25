import process from "node:process";
import { pathToFileURL } from "url";
import { loadComponentAsync } from "../load.mjs";
import "./error.mjs";

const url = pathToFileURL(process.cwd()).toString();

process.env.APPMAP_LOG_FILE = "1";

const params = {
  env: "node",
  emitter: "local",
  "validate-message": "off",
  "validate-appmap": "off",
};

const { createConfiguration, extendConfiguration } = await loadComponentAsync(
  "configuration",
  params,
);

const { Appmap } = await loadComponentAsync("recorder-api", params);

export const createAppMap = (home = url, conf = {}, base = url) =>
  new Appmap(extendConfiguration(createConfiguration(home), conf, base));
