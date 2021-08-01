import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Instrumentation from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { createInstrumentation, instrument, getInstrumentationIdentifier } =
    Instrumentation(dependencies);

  const instrumentation = createInstrumentation(
    extendConfiguration(
      createConfiguration("/"),
      {
        "hidden-identifier": "$",
        language: { version: 2020 },
        exclude: [],
        packages: [
          {
            path: "foo.js",
            enabled: true,
            exclude: [],
            shallow: true,
          },
          {
            path: "bar.js",
            enabled: false,
            exclude: [],
            shallow: true,
          },
        ],
      },
      "/cwd",
    ),
  );

  assertEqual(getInstrumentationIdentifier(instrumentation), "$uuid");

  assertDeepEqual(
    instrument(instrumentation, "script", "/cwd/foo.js", "123;"),
    {
      code: "123;",
      file: {
        index: 0,
        exclude: [],
        type: "script",
        path: "/cwd/foo.js",
        code: "123;",
      },
    },
  );

  assertDeepEqual(
    instrument(instrumentation, "script", "/cwd/bar.js", "456;"),
    {
      code: "456;",
      file: null,
    },
  );
};

testAsync();
