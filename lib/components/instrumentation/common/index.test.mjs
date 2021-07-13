import { strict as Assert } from "assert";
import component from "./index.mjs";

const { createInstrumenter, getInstrumenterRuntimeIdentifier, instrument } =
  component({}, {});

const instrumenter = createInstrumenter({
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

Assert.ok(getInstrumenterRuntimeIdentifier(instrumenter).startsWith("$"));

Assert.deepEqual(instrument(instrumenter, "script", "/dir/foo.js", "123;"), {
  code: "123;",
  entities: [
    {
      type: "package",
      source_type: "script",
      path: "foo.js",
      code: "123;",
      children: [],
    },
  ],
});

Assert.deepEqual(instrument(instrumenter, "script", "/dir/bar.js", "456;"), {
  code: "456;",
  entities: [
    {
      type: "package",
      source_type: "script",
      path: "bar.js",
      code: null,
      children: [],
    },
  ],
});

Assert.deepEqual(instrument(instrumenter, "script", "/dir/qux.js", "789;"), {
  code: "789;",
  entities: [],
});
