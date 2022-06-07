import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Configuration from "./index.mjs";

const { validateConfiguration } = await buildTestComponentAsync("validate");

const { matchSpecifier } = await buildTestComponentAsync("specifier");

const { createConfiguration, extendConfiguration } = Configuration(
  await buildTestDependenciesAsync(import.meta.url),
);

validateConfiguration(createConfiguration("file:///home"));

const extend = (
  name,
  value1,
  base = "file:///dummy",
  home = "file:///dummy",
) => {
  const configuration = extendConfiguration(
    createConfiguration(home),
    { [name]: value1 },
    base,
  );
  validateConfiguration(configuration);
  const { [name]: value2 } = configuration;
  return value2;
};

// packages //

{
  const [specifier, value] = extend("packages", "lib/*.js", "file:///base")[0];
  assertDeepEqual(value, {
    "inline-source": null,
    enabled: true,
    exclude: [],
    shallow: false,
  });
  assertEqual(matchSpecifier(specifier, "file:///base/lib/foo.js"), true);
  assertEqual(matchSpecifier(specifier, "file:///base/lib/foo.mjs"), false);
  assertEqual(matchSpecifier(specifier, "file:///base/src/foo.js"), false);
}

// scenarios //
assertDeepEqual(
  extend(
    "scenarios",
    { key: { command: ["node", "main.js"] } },
    "file:///base",
  ),
  [
    {
      base: "file:///base",
      key: "key",
      value: { command: ["node", "main.js"] },
    },
  ],
);

// command-options //
assertDeepEqual(
  extend("command-options", { env: { FOO: "BAR" }, timeout: 123 }),
  {
    shell: null,
    encoding: "utf8",
    env: { FOO: "BAR" },
    stdio: "inherit",
    timeout: 123,
    killSignal: "SIGTERM",
  },
);

// main //

assertDeepEqual(
  extend("main", "foo.js", "file:///base"),
  "file:///base/foo.js",
);

// port //

assertDeepEqual(
  extend("trace-port", "unix-domain-socket", "file:///base"),
  "file:///base/unix-domain-socket",
);

assertDeepEqual(extend("trace-port", "", "file:///base"), "");

assertDeepEqual(extend("trace-port", 8080, "file:///base"), 8080);

// language //

assertDeepEqual(extend("language", "foo@bar"), {
  name: "foo",
  version: "bar",
});

assertDeepEqual(extend("language", { name: "foo", version: "bar" }), {
  name: "foo",
  version: "bar",
});

// log //

assertDeepEqual(extend("log", "warning"), {
  level: "warning",
  file: 2,
});

assertDeepEqual(extend("log", { file: "log" }, "file:///base"), {
  level: "error",
  file: "file:///base/log",
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

assertDeepEqual(extend("output", "directory", "file:///base"), {
  directory: "file:///base/directory",
  basename: null,
  extension: ".appmap.json",
});

// processes //

assertDeepEqual(extend("processes", true, "file:///base", "file:///home"), [
  [{ base: "file:///base", source: "^", flags: "u" }, true],
  [true, true],
]);

assertDeepEqual(extend("processes", "/foo", "file:///base", "file:///home"), [
  [{ base: "file:///base", source: "^(?:\\/foo)$", flags: "" }, true],
  [true, true],
]);

// serialization //

assertDeepEqual(extend("serialization", "toString", null), {
  method: "toString",
  "maximum-length": 96,
  "include-constructor-name": true,
});

// command //

assertDeepEqual(extend("command", ["token1", "token2"], "file:///base"), {
  tokens: ["token1", "token2"],
  script: null,
  base: "file:///base",
});

assertDeepEqual(extend("command", "script", "file:///base"), {
  tokens: null,
  script: "script",
  base: "file:///base",
});

// exclude //

assertDeepEqual(extend("exclude", ["foo\\.bar"]), [
  {
    combinator: "and",
    "every-label": true,
    "some-label": true,
    name: true,
    "qualified-name": "foo\\.bar",
    excluded: true,
    recursive: true,
  },
  ...createConfiguration("file:///home").exclude,
]);
