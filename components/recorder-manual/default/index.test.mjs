import {
  assertEqual,
  assertDeepEqual,
  makeAbsolutePath,
} from "../../__fixture__.mjs";
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
  createConfiguration(makeAbsolutePath("repository")),
  {
    name: "name1",
    recorder: "manual",
    packages: ["*"],
    hooks: { cjs: false, esm: false, apply: false, http: false },
  },
  makeAbsolutePath("repository"),
);

const appmap = new Appmap(configuration);

const track = appmap.startTrack(null, { path: null, data: { name: "name2" } });
assertEqual(
  appmap.recordScript(makeAbsolutePath("repository", "main.js"), "123;"),
  123,
);
assertDeepEqual(appmap.stopTrack(track, { status: 123, errors: [] }), {
  configuration: {
    ...configuration,
    name: "name2",
  },
  sources: [
    {
      url: "file:///repository/main.js",
      content: "123;",
      exclude: createConfiguration(makeAbsolutePath("dummy")).exclude,
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
