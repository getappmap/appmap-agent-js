import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { validateInternalConfiguration } from "../../validate/index.mjs?env=test";
import { matchSpecifier } from "../../specifier/index.mjs?env=test";
import { createConfiguration, extendConfiguration } from "./index.mjs?env=test";

const { undefined } = globalThis;

validateInternalConfiguration(createConfiguration("file:///home"));

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
  validateInternalConfiguration(configuration);
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

// hooks.eval //

assertDeepEqual(extend("hooks", { eval: true }, "file:///base").eval, {
  hidden: "APPMAP_HOOK_EVAL",
  aliases: ["eval"],
});

assertDeepEqual(extend("hooks", { eval: false }, "file:///base").eval, {
  hidden: "APPMAP_HOOK_EVAL",
  aliases: [],
});

assertDeepEqual(extend("hooks", {}, "file:///base").eval, {
  hidden: "APPMAP_HOOK_EVAL",
  aliases: [],
});

assertDeepEqual(
  extend("hooks", { eval: { hidden: "foo", aliases: ["bar"] } }, "file:///base")
    .eval,
  {
    hidden: "foo",
    aliases: ["bar"],
  },
);

// hooks.esm //

assertDeepEqual(
  extend("hooks", { esm: true }, "file:///base").esm,
  "APPMAP_HOOK_ESM",
);

assertDeepEqual(extend("hooks", { esm: false }, "file:///base").esm, null);

assertDeepEqual(extend("hooks", {}, "file:///base").esm, "APPMAP_HOOK_ESM");

assertDeepEqual(extend("hooks", { esm: "FOO" }, "file:///base").esm, "FOO");

// hooks.apply //

assertDeepEqual(
  extend("hooks", { apply: true }, "file:///base").apply,
  "APPMAP_HOOK_APPLY",
);

assertDeepEqual(extend("hooks", { apply: false }, "file:///base").apply, null);

assertDeepEqual(extend("hooks", {}, "file:///base").apply, "APPMAP_HOOK_APPLY");

assertDeepEqual(extend("hooks", { apply: "FOO" }, "file:///base").apply, "FOO");

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

assertDeepEqual(extend("language", "javascript"), "javascript");

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

assertDeepEqual(
  extend("frameworks", [
    "foo@bar",
    { name: "foo", version: "bar" },
    "foo",
    { name: "foo", version: null },
  ]),
  [
    {
      name: "foo",
      version: "bar",
    },
    {
      name: "foo",
      version: "bar",
    },
    {
      name: "foo",
      version: null,
    },
    {
      name: "foo",
      version: null,
    },
  ],
);

// processes //

assertDeepEqual(extend("processes", true, "file:///base", "file:///home"), [
  [{ base: "file:///base", source: "^", flags: "u" }, true],
  [true, true],
]);

assertDeepEqual(extend("processes", "/foo", "file:///base", "file:///home"), [
  [{ base: "file:///base", source: "^(?:\\/foo)$", flags: "" }, true],
  [true, true],
]);

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

// additional //

assertDeepEqual(extend("additional", "foo", "bar"), undefined);
