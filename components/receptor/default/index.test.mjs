import { tmpdir } from "os";
import { mkdir as mkdirAsync } from "fs/promises";

import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";

import Receptor from "./index.mjs";

const { createConfiguration } = await buildTestComponentAsync("configuration");

const {
  openReceptorAsync,
  minifyReceptorConfiguration,
  closeReceptorAsync,
  adaptReceptorConfiguration,
} = Receptor(await buildTestDependenciesAsync(import.meta.url));

const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
await mkdirAsync(directory);
const configuration = createConfiguration(directory);

const receptor = await openReceptorAsync(
  minifyReceptorConfiguration(configuration),
);
adaptReceptorConfiguration(receptor, configuration);
await closeReceptorAsync(receptor);