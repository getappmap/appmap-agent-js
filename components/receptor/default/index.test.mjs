import { getFreshTemporaryURL } from "../../__fixture__.mjs";
import { mkdir as mkdirAsync } from "fs/promises";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import {
  openReceptorAsync,
  minifyReceptorConfiguration,
  closeReceptorAsync,
  adaptReceptorConfiguration,
} from "./index.mjs?env=test";

const { URL } = globalThis;

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
