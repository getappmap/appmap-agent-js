import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderManual from "./index.mjs";

const { Appmap } = RecorderManual(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = extendConfiguration(
  createConfiguration("file:///home"),
  {
    name: "name1",
    recorder: "manual",
    packages: ["*"],
    hooks: { cjs: false, esm: false, apply: false, http: false },
  },
  "file:///base",
);

const appmap = new Appmap(configuration);
assertEqual(typeof appmap.instrumentModule("123;", "file:///base/main.js"), "string");

const track = appmap.startTrack(null, { path: null, data: { name: "name2" } });
assertEqual(appmap.recordScript("123;", "file:///base/main.js"), 123);
assertDeepEqual(appmap.stopTrack(track, { status: 123, errors: [] }), {
  configuration: {
    ...configuration,
    name: "name2",
  },
  sources: [
    {
      url: "file:///base/main.js",
      content: "123;",
      exclude: createConfiguration("file:///home").exclude,
      shallow: false,
      inline: false,
    },
  ],
  events: [],
  termination: {
    status: 123,
    errors: [],
  },
});
appmap.terminate();
