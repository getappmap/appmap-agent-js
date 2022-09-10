import { getFreshTemporaryURL } from "../../__fixture__.mjs";
import { mkdir as mkdirAsync } from "fs/promises";

import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";

import Receptor from "./index.mjs";

const {URL} = globalThis;

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  openReceptorAsync,
  minifyReceptorConfiguration,
  closeReceptorAsync,
  adaptReceptorConfiguration,
} = Receptor(await buildTestDependenciesAsync(import.meta.url));

const directory = getFreshTemporaryURL();
await mkdirAsync(new URL(directory));
const configuration = extendConfiguration(
  createConfiguration(directory),
  { recorder: "process", appmap_dir: "directory" },
  directory,
);

const receptor = await openReceptorAsync(
  minifyReceptorConfiguration(configuration),
);
adaptReceptorConfiguration(receptor, configuration);
await closeReceptorAsync(receptor);
