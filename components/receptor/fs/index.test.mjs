import { tmpdir } from "os";
import { strict as Assert } from "assert";

import { buildTestDependenciesAsync } from "../../build.mjs";
import Receptor from "./index.mjs";

const {
  // equal:assertEqual,
} = Assert;

const {
  openReceptorAsync,
  getReceptorTracePort,
  getReceptorTrackPort,
  closeReceptorAsync,
} = Receptor(
  await buildTestDependenciesAsync(import.meta.url),
);

const configuration =
