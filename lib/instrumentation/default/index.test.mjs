import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Instrumentation from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const mainAsync = async () => {
  const dependencies = await buildAsync({
    violation: "error",
    assert: "debug",
    util: "default",
    uuid: "stub",
    specifier: "default",
  });
  const {
    specifier: { createSpecifier },
  } = dependencies;
  const { createInstrumentation, instrument, getInstrumentationIdentifier } =
    Instrumentation(dependencies);

  const instrumentation = createInstrumentation({
    "hidden-identifier": "$",
    language: { version: 2020 },
    "include-source": false,
    exclude: [],
    packages: [
      [
        createSpecifier("/cwd", { path: "foo.js" }),
        { enabled: true, source: true, exclude: [], shallow: true },
      ],
      [
        createSpecifier("/cwd", { path: "bar.js" }),
        { enabled: true, source: null, exclude: [], shallow: true },
      ],
      [
        createSpecifier("/cwd", { path: "qux.js" }),
        { enabled: false, source: null, exclude: [], shallow: true },
      ],
    ],
  });

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

mainAsync();
