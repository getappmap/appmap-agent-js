const { URLSearchParams, process } = globalThis;

import { pathToFileURL } from "url";
import "./error.mjs";

const url = pathToFileURL(process.cwd()).toString();

process.env.APPMAP_LOG_FILE = "1";

const params = new URLSearchParams({
  env: "node",
  emitter: "local",
  "validate-message": "off",
  "validate-appmap": "off",
});

const { createConfiguration, extendConfiguration } = await import(
  `../../components/configuration/index.mjs?${params.toString()}`
);

const { Appmap } = await import(
  `../../components/recorder-api/index.mjs?${params.toString()}`
);

export const createAppMap = (home = url, conf = {}, base = url) =>
  new Appmap(extendConfiguration(createConfiguration(home), conf, base));
