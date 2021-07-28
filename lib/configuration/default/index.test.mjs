/* eslint-env node */

import { resolve } from "path";
import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Configuration from "./index.mjs";

const { cwd } = process;
const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const testAsync = async () => {
  const { createConfiguration, extendConfiguration } = Configuration(
    await buildAsync({
      violation: "error",
      assert: "debug",
      log: "off",
      util: "default",
      repository: "stub",
      specifier: "default",
    }),
  );

  const configuration = createConfiguration(cwd());

  const extend = (name, value1) => {
    const yo = extendConfiguration(configuration, { [name]: value1 }, cwd());
    const { [name]: value2 } = yo;
    return value2;
  };

  // main //

  assertDeepEqual(extend("main", "foo.js"), { path: resolve("foo.js") });

  assertDeepEqual(extend("main", { path: null }), { path: null });

  // language //

  assertDeepEqual(extend("language", "foo@bar"), {
    name: "foo",
    version: "bar",
  });

  assertDeepEqual(extend("language", "foo"), {
    name: "foo",
    version: null,
  });

  assertDeepEqual(extend("language", "foo@bar@qux"), {
    name: "foo",
    version: "bar@qux",
  });

  assertDeepEqual(extend("language", { name: "foo", version: "bar" }), {
    name: "foo",
    version: "bar",
  });

  // recorder //

  assertDeepEqual(extend("recorder", "foo"), { name: "foo" });

  // recording //

  assertDeepEqual(extend("recording", "foo.bar"), {
    "defined-class": "foo",
    "method-id": "bar",
  });

  // frameworks //

  assertDeepEqual(extend("frameworks", ["foo@bar"]), [
    {
      name: "foo",
      version: "bar",
    },
  ]);

  // output //

  assertDeepEqual(extend("output", "foo"), {
    directory: resolve("foo"),
    filename: null,
  });

  assertDeepEqual(extend("output", { filename: "foo" }), {
    directory: resolve("tmp", "appmap"),
    filename: "foo",
  });

  // identity //

  assertEqual(extend("app-name", "foo"), "foo");

  // enabled //

  assertDeepEqual(extend("enabled", true), [
    [{ source: "^", flags: "", basedir: cwd() }, true],
  ]);

  assertDeepEqual(extend("enabled", ["/foo"]), [
    [
      {
        source: "^\\/foo($|/[^/]*$)",
        flags: "",
        basedir: cwd(),
      },
      true,
    ],
  ]);

  // packages //

  assertDeepEqual(extend("packages", ["/foo"]), [
    [
      {
        source: "^\\/foo($|/[^/]*$)",
        flags: "",
        basedir: cwd(),
      },
      { shallow: false, enabled: true, exclude: [], source: null },
    ],
  ]);

  // hooks //

  assertDeepEqual(extend("hooks", ["pg", "mysql", "sqlite3"]), {
    apply: true,
    cjs: true,
    esm: true,
    http: true,
    mysql: true,
    sqlite3: true,
    pg: true,
  });
};

testAsync();
