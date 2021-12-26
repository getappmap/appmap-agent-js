import {
  assertDeepEqual,
  assertEqual,
  makeAbsolutePath,
} from "../../__fixture__.mjs";
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

validateConfiguration(createConfiguration(makeAbsolutePath("home")));

const extend = (
  name,
  value1,
  nullable_directory = null,
  home_directory = makeAbsolutePath("home"),
) => {
  const extended_configuration = extendConfiguration(
    createConfiguration(home_directory),
    { [name]: value1 },
    nullable_directory,
  );
  validateConfiguration(extended_configuration);
  const { [name]: value2 } = extended_configuration;
  return value2;
};

// packages //

{
  const [specifier, value] = extend(
    "packages",
    "lib/*.js",
    makeAbsolutePath("cwd"),
  )[0];
  assertDeepEqual(value, {
    "inline-source": null,
    enabled: true,
    exclude: [],
    shallow: false,
  });
  assertEqual(
    matchSpecifier(specifier, makeAbsolutePath("cwd", "lib", "foo.js")),
    true,
  );
  assertEqual(
    matchSpecifier(specifier, makeAbsolutePath("cwd", "lib", "foo.mjs")),
    false,
  );
  assertEqual(
    matchSpecifier(specifier, makeAbsolutePath("cwd", "src", "foo.js")),
    false,
  );
}

// scenarios //
assertDeepEqual(
  extend(
    "scenarios",
    { key: { command: "node main.js" } },
    makeAbsolutePath("cwd"),
  ),
  [
    {
      cwd: makeAbsolutePath("cwd"),
      key: "key",
      value: { command: "node main.js" },
    },
  ],
);

// command-options //
assertDeepEqual(
  extend("command-options", { env: { FOO: "BAR" }, timeout: 123 }),
  {
    encoding: "utf8",
    env: { FOO: "BAR" },
    stdio: "inherit",
    timeout: 123,
    killSignal: "SIGTERM",
  },
);

// main //

assertDeepEqual(
  extend("main", "foo.js", makeAbsolutePath("cwd")),
  makeAbsolutePath("cwd", "foo.js"),
);

// port //

assertDeepEqual(
  extend("trace-port", "unix-domain-socket", makeAbsolutePath("cwd")),
  makeAbsolutePath("cwd", "unix-domain-socket"),
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

assertDeepEqual(extend("output", "directory", makeAbsolutePath("cwd")), {
  directory: makeAbsolutePath("cwd", "directory"),
  basename: null,
  extension: ".appmap.json",
});

// processes //

assertDeepEqual(
  extend("processes", true, makeAbsolutePath("cwd"), makeAbsolutePath("home")),
  [
    [{ cwd: makeAbsolutePath("cwd"), source: "^", flags: "u" }, true],
    [
      {
        cwd: makeAbsolutePath("home"),
        source: "^",
        flags: "u",
      },
      true,
    ],
  ],
);

assertDeepEqual(
  extend(
    "processes",
    makeAbsolutePath("foo"),
    makeAbsolutePath("cwd"),
    makeAbsolutePath("home"),
  ),
  [
    [{ cwd: makeAbsolutePath("cwd"), source: "^(?:\\/foo)$", flags: "" }, true],
    [
      {
        cwd: makeAbsolutePath("home"),
        source: "^",
        flags: "u",
      },
      true,
    ],
  ],
);

// serialization //

assertDeepEqual(extend("serialization", "toString", null), {
  method: "toString",
  "maximum-length": 96,
  "include-constructor-name": true,
});

// command //

assertDeepEqual(extend("command", "node main.js", makeAbsolutePath("cwd")), {
  value: "node main.js",
  cwd: makeAbsolutePath("cwd"),
});

// exclude //

assertDeepEqual(extend("exclude", ["foo\\.bar"], null), [
  {
    combinator: "and",
    "every-label": true,
    "some-label": true,
    name: true,
    "qualified-name": "foo\\.bar",
    excluded: true,
    recursive: true,
  },
  ...createConfiguration(makeAbsolutePath("base")).exclude,
]);
