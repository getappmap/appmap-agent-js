import { strict as Assert } from "assert";
import component from "./index.mjs";

const { runtime, instrument } = component({}, {}).create({
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

Assert.equal(typeof runtime, "string");
Assert.ok(runtime.startsWith("$"));

Assert.deepEqual(instrument("script", "/dir/foo.js", "123;"), {
  code: "123;",
  entities: [
    {
      type: "package",
      name: "foo.js",
      source: "123;",
      children: [],
    },
  ],
});

Assert.deepEqual(instrument("script", "/dir/bar.js", "456;"), {
  code: "456;",
  entities: [
    {
      type: "package",
      name: "bar.js",
      source: null,
      children: [],
    },
  ],
});

Assert.deepEqual(instrument("script", "/dir/qux.js", "789;"), {
  code: "789;",
  entities: [],
});
