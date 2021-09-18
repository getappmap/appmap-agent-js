import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderManual from "./index.mjs";

const {
  // equal: assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const { Appmap } = RecorderManual(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const appmap = new Appmap(
  extendConfiguration(
    createConfiguration("/repository"),
    {
      recorder: "manual",
      hooks: { cjs: false, esm: false, apply: false, http: false },
    },
    null,
  ),
);

const recording = appmap.start({});
// recording.pause();
// recording.play();
recording.stop({ errors: [], status: 0 });
assertDeepEqual(
  (await appmap.terminate()).map(([type]) => type),
  ["initialize", "start", "stop", "terminate"],
);
