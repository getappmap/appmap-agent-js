import { strict as Assert } from "assert";
import { buildAllAsync } from "../../../build.mjs";
import Instrumentation from "./index.mjs";

const mainAsync = async () => {
  const { createInstrumentation, instrument, getInstrumentationIdentifier } =
    Instrumentation(
      await buildAllAsync(["util", "expect"], { expect: "error" }),
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

  Assert.ok(getInstrumentationIdentifier(instrumentation).startsWith("$"));

  Assert.deepEqual(
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

  Assert.deepEqual(
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

  Assert.deepEqual(
    instrument(instrumentation, "script", "/dir/qux.js", "789;"),
    {
      code: "789;",
      entity: null,
    },
  );
};

mainAsync();
