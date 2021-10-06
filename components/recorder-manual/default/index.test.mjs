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

const configuration = extendConfiguration(
  createConfiguration("/repository"),
  {
    name: "name1",
    recorder: "manual",
    packages: ["*"],
    hooks: { cjs: false, esm: false, apply: false, http: false },
  },
  "/repository",
);

const appmap = new Appmap(configuration);

const track = appmap.startTrack(null, { path: null, data: { name: "name2" } });
assertEqual(appmap.recordScript("/repository/main.js", "123;"), 123);
assertDeepEqual(appmap.stopTrack(track, { status: 123, errors: [] }), {
  configuration: {
    ...configuration,
    name: "name2",
  },
  files: [
    {
      code: "123;",
      exclude: [],
      index: 0,
      path: "/repository/main.js",
      shallow: false,
      source: false,
      type: "script",
    },
  ],
  events: [],
  termination: {
    status: 123,
    errors: [],
  },
});
appmap.terminate();
