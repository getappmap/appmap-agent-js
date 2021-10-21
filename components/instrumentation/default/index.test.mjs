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
      "inline-source": false,
      packages: [
        {
          path: "foo.js",
          enabled: true,
          exclude: ["foo"],
          shallow: true,
          "inline-source": true,
        },
        {
          path: "bar.js",
          enabled: false,
          exclude: ["bar"],
          shallow: false,
          "inline-source": false,
        },
      ],
      exclude: ["qux"],
    },
    "/cwd",
  ),
);

assertEqual(getInstrumentationIdentifier(instrumentation), "$uuid");

assertDeepEqual(
  instrument(instrumentation, {
    url: "file:///cwd/foo.js",
    content: "123;",
    type: "script",
  }),
  {
    url: "file:///cwd/foo.js",
    content: "123;",
    sources: [
      {
        url: "file:///cwd/foo.js",
        content: "123;",
        shallow: true,
        "inline-source": true,
        exclude: ["qux", "foo"],
      },
    ],
  },
);

assertDeepEqual(
  instrument(instrumentation, {
    url: "file:///cwd/bar.js",
    content: "456;",
    type: "script",
  }),
  {
    url: "file:///cwd/bar.js",
    content: "456;",
    sources: [],
  },
);
