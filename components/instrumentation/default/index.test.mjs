import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { writeFile, mkdir } from "fs/promises";
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

const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
await mkdir(directory);

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
    directory,
  ),
);

assertEqual(getInstrumentationIdentifier(instrumentation), "$uuid");

await writeFile(`${directory}/foo.js.map`, "[123]", "utf8");

assertDeepEqual(
  instrument(
    instrumentation,
    "script",
    `${directory}/foo.js`,
    `123;//# sourceMappingURL=foo.js.map`,
  ),
  {
    code: "123;",
    file: {
      index: 0,
      exclude: [],
      shallow: true,
      source: false,
      type: "script",
      path: `${directory}/foo.js`,
      code: `123;//# sourceMappingURL=foo.js.map`,
      source_map_url: `file://${directory}/foo.js.map`,
      source_map: [123],
    },
  },
);

assertDeepEqual(
  instrument(instrumentation, "script", `${directory}/bar.js`, "456;"),
  {
    code: "456;",
    file: null,
  },
);
