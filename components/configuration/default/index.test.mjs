/* eslint-env node */

import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Configuration from "./index.mjs";

const { cwd } = process;
const {
  deepEqual: assertDeepEqual,
  equal: assertEqual,
  // throws: assertThrows,
} = Assert;

const { validateConfiguration } = await buildTestComponentAsync("validate");

const { matchSpecifier } = await buildTestComponentAsync("specifier");

const { createConfiguration, extendConfiguration } = Configuration(
  await buildTestDependenciesAsync(import.meta.url),
);

const configuration = createConfiguration(cwd());

validateConfiguration(configuration);

const extend = (name, value1, nullable_directory) => {
  const extended_configuration = extendConfiguration(
    configuration,
    { [name]: value1 },
    nullable_directory,
  );
  validateConfiguration(extended_configuration);
  const { [name]: value2 } = extended_configuration;
  return value2;
};

// packages //

{
  const [specifier, value] = extend("packages", "lib/*.js", "/base")[0];
  assertDeepEqual(value, {
    "inline-source": null,
    enabled: true,
    exclude: [],
    shallow: false,
  });
  assertEqual(matchSpecifier(specifier, "/base/lib/foo.js"), true);
  assertEqual(matchSpecifier(specifier, "/base/lib/foo.mjs"), false);
  assertEqual(matchSpecifier(specifier, "/base/src/foo.js"), false);
}

// command-options //
assertDeepEqual(
  extend("command-options", { env: { FOO: "BAR" }, timeout: 123 }, "/base"),
  {
    encoding: "utf8",
    cwd: cwd(),
    env: { FOO: "BAR" },
    stdio: "inherit",
    timeout: 123,
    killSignal: "SIGTERM",
  },
);

// main //

assertDeepEqual(extend("main", "foo.js", "/base"), "/base/foo.js");

// port //

assertDeepEqual(
  extend("trace-port", "unix-domain-socket", "/base"),
  "/base/unix-domain-socket",
);

// language //

assertDeepEqual(extend("language", "foo@bar", null), {
  name: "foo",
  version: "bar",
});

assertDeepEqual(extend("language", { name: "foo", version: "bar" }, null), {
  name: "foo",
  version: "bar",
});

// recording //

assertDeepEqual(extend("recording", "foo.bar", null), {
  "defined-class": "foo",
  "method-id": "bar",
});

// frameworks //

assertDeepEqual(extend("frameworks", ["foo@bar"], null), [
  {
    name: "foo",
    version: "bar",
  },
]);

// output //

assertDeepEqual(extend("output", "directory", "/base"), {
  directory: "/base/directory",
  basename: null,
  extension: ".appmap.json",
});

// processes //

assertDeepEqual(extend("processes", true, "/base"), [
  [{ basedir: "/base", source: "^", flags: "u" }, true],
  [
    {
      basedir: cwd(),
      source: "^",
      flags: "u",
    },
    true,
  ],
]);

assertDeepEqual(extend("processes", "/foo", "/base"), [
  [{ basedir: "/base", source: "^(?:\\/foo)$", flags: "" }, true],
  [
    {
      basedir: cwd(),
      source: "^",
      flags: "u",
    },
    true,
  ],
]);

// serialization //

assertDeepEqual(extend("serialization", "toString", null), {
  method: "toString",
  "maximum-length": 96,
  "include-constructor-name": true,
});
