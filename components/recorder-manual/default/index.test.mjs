import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderManual from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const { Appmap } = RecorderManual(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const appmap = new Appmap(
  extendConfiguration(
    createConfiguration("/repository"),
    {
      packages: ["*"],
      recorder: "manual",
      hooks: { cjs: false, esm: false, apply: false, http: false },
    },
    "/repository",
  ),
);

const track = Appmap.getUniversalUniqueIdentifier();
appmap.startStoredTrack(track);
assertEqual(appmap.runScript("/repository/main.js", "123;"), 123);
appmap.stopStoredTrack(track);
assertDeepEqual(
  (await appmap.terminate()).map(([type]) => type),
  ["initialize", "start", "file", "stop", "terminate"],
);
