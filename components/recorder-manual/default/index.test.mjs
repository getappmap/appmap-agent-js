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
      mode: "local",
      recorder: "manual",
      packages: ["*"],
      hooks: { cjs: false, esm: false, apply: false, http: false },
    },
    "/repository",
  ),
);

const track = Appmap.getUniversalUniqueIdentifier();
appmap.startTrack(track, { path: null, data: { output: null } });
assertEqual(appmap.recordScript("/repository/main.js", "123;"), 123);
appmap.stopTrack(track);
assertEqual(await appmap.claimTrackAsync(track), null);
assertDeepEqual(
  (await appmap.terminate()).map((element) => {
    if (Array.isArray(element)) {
      return element[0];
    }
    return element.method;
  }),
  ["initialize", "start", "file", "stop", "DELETE", "terminate"],
);
