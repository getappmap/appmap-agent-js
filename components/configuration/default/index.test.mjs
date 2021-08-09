/* eslint-env node */

import { resolve } from "path";
import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import Configuration from "./index.mjs";

const { cwd } = process;
const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual
} = Assert;

const testAsync = async () => {
  const {
    createConfiguration,
    extendConfiguration,
    extractEnvironmentConfiguration,
  } = Configuration(await buildDependenciesAsync(import.meta.url, "test"));

  const configuration = createConfiguration(cwd());

  const extend = (name, value1) => {
    const { [name]: value2 } = extendConfiguration(
      configuration,
      { [name]: value1 },
      cwd(),
    );
    return value2;
  };

  // extract //

  assertDeepEqual(
    extractEnvironmentConfiguration({
      APPMAP_FOO_BAR: "value1",
      QUX: "value2",
    }),
    { "foo-bar": "value1" },
  );

  // main //

  assertDeepEqual(extend("main", "foo.js"), resolve("foo.js"));

  // log-level //

  assertDeepEqual(extend("log-level", "Warning"), "warning");

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
    postfix: ".appmap",
    indent: null,
  });

  assertDeepEqual(extend("output", { filename: "foo" }), {
    directory: resolve("tmp", "appmap"),
    filename: "foo",
    postfix: ".appmap",
    indent: null,
  });

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
