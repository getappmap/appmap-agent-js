import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Instrumentation from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const { createMirrorSourceMap } = await buildTestComponentAsync("source");
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");
const { createInstrumentation, instrument, getInstrumentationIdentifier } =
  Instrumentation(await buildTestDependenciesAsync(import.meta.url));

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

{
  const file = {
    url: "file:///cwd/foo.js",
    content: "123;",
    type: "script",
  };
  assertDeepEqual(
    instrument(instrumentation, file, createMirrorSourceMap(file)),
    {
      url: "file:///cwd/foo.js",
      content: "123;",
      sources: [
        {
          url: "file:///cwd/foo.js",
          content: "123;",
          shallow: true,
          inline: true,
          exclude: ["qux", "foo"],
        },
      ],
    },
  );
}

{
  const file = {
    url: "file:///cwd/bar.js",
    content: "456;",
    type: "script",
  };
  assertDeepEqual(
    instrument(instrumentation, file, createMirrorSourceMap(file)),
    {
      url: "file:///cwd/bar.js",
      content: "456;",
      sources: [],
    },
  );
}
