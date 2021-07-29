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
  const {
    createInstrumentation,
    instrument,
    getInstrumentationIdentifier,
    configureInstrumentation,
  } = Instrumentation(dependencies);

  const instrumentation = createInstrumentation();
  configureInstrumentation(
    instrumentation,
    extendConfiguration(
      createConfiguration("/"),
      {
        "hidden-identifier": "$",
        language: { version: 2020 },
        source: false,
        exclude: [],
        packages: [
          {
            path: "foo.js",
            enabled: true,
            source: true,
            exclude: [],
            shallow: true,
          },
          {
            path: "bar.js",
            enabled: true,
            source: null,
            exclude: [],
            shallow: true,
          },
          {
            path: "qux.js",
            enabled: false,
            source: null,
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
      module: {
        kind: "script",
        path: "/cwd/foo.js",
        code: "123;",
        children: [],
      },
    },
  );

  assertDeepEqual(
    instrument(instrumentation, "script", "/cwd/bar.js", "456;"),
    {
      code: "456;",
      module: {
        kind: "script",
        path: "/cwd/bar.js",
        code: null,
        children: [],
      },
    },
  );

  assertDeepEqual(
    instrument(instrumentation, "script", "/cwd/qux.js", "789;"),
    {
      code: "789;",
      module: null,
    },
  );
};

testAsync();
