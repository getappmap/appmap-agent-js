import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Instrumentation from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const mainAsync = async () => {
  const { createInstrumentation, instrument, getInstrumentationIdentifier } =
    Instrumentation(
      await buildAsync({ util: "default", expect: "error", uuid: "mock" }),
    );

  const instrumentation = createInstrumentation({
    hidden: "$",
    basedir: "/dir/",
    packages: [
      {
        path: "foo.js",
        source: true,
      },
      {
        path: "bar.js",
        source: false,
      },
    ],
  });

  assertEqual(getInstrumentationIdentifier(instrumentation), "$uuid");

  assertDeepEqual(
    instrument(instrumentation, "script", "/dir/foo.js", "123;"),
    {
      code: "123;",
      entity: {
        kind: "script",
        path: "foo.js",
        code: "123;",
        children: [],
      },
    },
  );

  assertDeepEqual(
    instrument(instrumentation, "script", "/dir/bar.js", "456;"),
    {
      code: "456;",
      entity: {
        kind: "script",
        path: "bar.js",
        code: null,
        children: [],
      },
    },
  );

  assertDeepEqual(
    instrument(instrumentation, "script", "/dir/qux.js", "789;"),
    {
      code: "789;",
      entity: null,
    },
  );
};

mainAsync();
