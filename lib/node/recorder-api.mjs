import process from "node:process";
import { pathToFileURL } from "node:url";

import "./error.mjs";

const url = pathToFileURL(process.cwd()).toString();

const { createConfiguration, extendConfiguration } = await import(
  "../../dist/bundles/configuration.mjs"
);

const { Appmap } = await import("../../dist/bundles/recorder-api.mjs");

export const createAppMap = (home = url, conf = {}, base = url) =>
  new Appmap(extendConfiguration(createConfiguration(home), conf, base));
