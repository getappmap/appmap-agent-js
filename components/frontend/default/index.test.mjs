import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Frontend from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createMirrorSourceMap } = await buildTestComponentAsync("source");
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const {
  createFrontend,
  startTrack,
  stopTrack,
  getInstrumentationIdentifier,
  instrument,
} = Frontend(dependencies);
const configuration = extendConfiguration(
  createConfiguration("/"),
  {
    packages: [
      {
        regexp: "^",
      },
    ],
  },
  "/",
);
const { "hidden-identifier": identifier } = configuration;
const frontend = createFrontend(configuration);
{
  assertDeepEqual(startTrack(frontend, "track", "initialization"), [
    "start",
    "track",
    "initialization",
  ]);
  assertDeepEqual(stopTrack(frontend, "track", { errors: [], status: 0 }), [
    "stop",
    "track",
    {
      errors: [],
      status: 0,
    },
  ]);
}
assertEqual(
  getInstrumentationIdentifier(frontend).startsWith(identifier),
  true,
);
{
  const file = { url: "file:///filename.js", content: "123;", type: "script" };
  assertDeepEqual(instrument(frontend, file, createMirrorSourceMap(file)), {
    url: "file:///filename.js",
    content: "123;",
    messages: [
      [
        "source",
        {
          url: "file:///filename.js",
          content: "123;",
          exclude: createConfiguration("/bar").exclude,
          shallow: false,
          inline: false,
        },
      ],
    ],
  });
}
