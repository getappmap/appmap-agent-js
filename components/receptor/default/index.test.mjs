import { getFreshTemporaryPath } from "../../__fixture__.mjs";
import { dirname as getDirectory } from "path";
import { mkdir as mkdirAsync } from "fs/promises";

import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";

import Receptor from "./index.mjs";

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  openReceptorAsync,
  minifyReceptorConfiguration,
  closeReceptorAsync,
  adaptReceptorConfiguration,
} = Receptor(await buildTestDependenciesAsync(import.meta.url));

const directory = getFreshTemporaryPath();
await mkdirAsync(directory);
const configuration = extendConfiguration(
  createConfiguration(directory),
  { recorder: "process", output: { directory: getDirectory(directory) } },
  null,
);

const receptor = await openReceptorAsync(
  minifyReceptorConfiguration(configuration),
);
adaptReceptorConfiguration(receptor, configuration);
await closeReceptorAsync(receptor);
