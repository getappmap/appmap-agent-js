import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Instrumentation from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const { createInstrumentation, instrument, getInstrumentationIdentifier } =
  Instrumentation(dependencies);

const instrumentation = createInstrumentation(
  extendConfiguration(
    createConfiguration("/"),
    {
      "hidden-identifier": "$",
      language: { name: "ecmascript", version: "2020" },
      exclude: [],
      source: false,
      packages: [
        {
          path: "foo.js",
          enabled: true,
          exclude: [],
          shallow: true,
          source: null,
        },
        {
          path: "bar.js",
          enabled: false,
          exclude: [],
          shallow: false,
          source: null,
        },
      ],
    },
    "/cwd",
  ),
);

assertEqual(getInstrumentationIdentifier(instrumentation), "$uuid");

assertDeepEqual(instrument(instrumentation, "script", "/cwd/foo.js", "123;"), {
  code: "123;",
  file: {
    index: 0,
    exclude: [],
    shallow: true,
    source: false,
    type: "script",
    path: "/cwd/foo.js",
    code: "123;",
  },
});

assertDeepEqual(instrument(instrumentation, "script", "/cwd/bar.js", "456;"), {
  code: "456;",
  file: null,
});
