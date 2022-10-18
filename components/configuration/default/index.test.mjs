import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { validateInternalConfiguration } from "../../validate/index.mjs?env=test";
import { matchSpecifier } from "../../specifier/index.mjs?env=test";
import { createConfiguration, extendConfiguration } from "./index.mjs?env=test";

const { undefined } = globalThis;

validateInternalConfiguration(createConfiguration("file:///w:/home/"));

const extend = (
  name,
  value1,
  base = "http://host/base/",
  home = "http://host/home/",
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

// agent //
assertDeepEqual(
  extend(
    "agent",
    {
      directory: "agent",
      package: { name: "appmap-agent-js", version: "1.2.3", homepage: null },
    },
    "file:///w:/base/",
  ),
  {
    directory: "file:///w:/base/agent/",
    package: {
      name: "appmap-agent-js",
      version: "1.2.3",
      homepage: null,
    },
  },
);

// packages //

{
  const [specifier, value] = extend(
    "packages",
    "lib/*.js",
    "file:///w:/base/",
  )[0];
  assertDeepEqual(value, {
    "inline-source": null,
    enabled: true,
    exclude: [],
    shallow: false,
  });
  assertEqual(matchSpecifier(specifier, "file:///w:/base/lib/foo.js"), true);
  assertEqual(matchSpecifier(specifier, "file:///w:/base/lib/foo.mjs"), false);
  assertEqual(matchSpecifier(specifier, "file:///w:/base/src/foo.js"), false);
}

// hooks.eval //

assertDeepEqual(extend("hooks", { eval: true }).eval, {
  hidden: "APPMAP_HOOK_EVAL",
  aliases: ["eval"],
});

assertDeepEqual(extend("hooks", { eval: false }).eval, {
  hidden: "APPMAP_HOOK_EVAL",
  aliases: [],
});

assertDeepEqual(extend("hooks", {}).eval, {
  hidden: "APPMAP_HOOK_EVAL",
  aliases: [],
});

assertDeepEqual(
  extend("hooks", { eval: { hidden: "foo", aliases: ["bar"] } }).eval,
  {
    hidden: "foo",
    aliases: ["bar"],
  },
);

// hooks.esm //

assertDeepEqual(extend("hooks", { esm: true }).esm, "APPMAP_HOOK_ESM");

assertDeepEqual(extend("hooks", { esm: false }).esm, null);

assertDeepEqual(extend("hooks", {}).esm, "APPMAP_HOOK_ESM");

assertDeepEqual(extend("hooks", { esm: "FOO" }).esm, "FOO");

// hooks.apply //

assertDeepEqual(extend("hooks", { apply: true }).apply, "APPMAP_HOOK_APPLY");

assertDeepEqual(extend("hooks", { apply: false }).apply, null);

assertDeepEqual(extend("hooks", {}).apply, "APPMAP_HOOK_APPLY");

assertDeepEqual(extend("hooks", { apply: "FOO" }).apply, "FOO");

// scenarios //
assertDeepEqual(
  extend(
    "scenarios",
    { key: { command: ["node", "main.js"] } },
    "file:///w:/base/",
  ),
  [
    {
      base: "file:///w:/base/",
      key: "key",
      value: { command: ["node", "main.js"] },
    },
  ],
);

// command-options //
assertDeepEqual(
  extend(
    "command-options",
    { env: { FOO: "BAR" }, timeout: 123 },
    "file:///w:/base/conf.yml",
  ),
  {
    cwd: "file:///w:/base/",
    shell: null,
    encoding: "utf8",
    env: { FOO: "BAR" },
    stdio: "inherit",
    timeout: 123,
    killSignal: "SIGTERM",
  },
);

assertDeepEqual(extend("command-options", { cwd: "cwd" }, "file:///w:/base/"), {
  cwd: "file:///w:/base/cwd/",
  shell: null,
  encoding: "utf8",
  env: {},
  stdio: "inherit",
  timeout: 0,
  killSignal: "SIGTERM",
});

// main //

assertDeepEqual(
  extend("main", "foo.js", "file:///w:/base/"),
  "file:///w:/base/foo.js",
);

// port //

assertDeepEqual(
  extend("trace-port", "unix-domain-socket", "file:///w:/base/"),
  "file:///w:/base/unix-domain-socket",
);

assertDeepEqual(extend("trace-port", "", "file:///w:/base/"), "");

assertDeepEqual(extend("trace-port", 8080, "file:///w:/base/"), 8080);

// language //

assertDeepEqual(extend("language", "javascript"), "javascript");

// log //

assertDeepEqual(extend("log", "warning"), {
  level: "warning",
  file: 2,
});

assertDeepEqual(extend("log", { file: "log" }, "file:///w:/base/"), {
  level: "error",
  file: "file:///w:/base/log",
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

assertDeepEqual(
  extend("processes", true, "file:///w:/base/", "file:///w:/home"),
  [
    [{ base: "file:///w:/base/", source: "^", flags: "u" }, true],
    [true, true],
  ],
);

assertDeepEqual(
  extend("processes", "/foo", "file:///w:/base/", "file:///w:/home"),
  [
    [{ base: "file:///w:/base/", source: "^(?:\\/foo)$", flags: "" }, true],
    [true, true],
  ],
);

// command //

assertDeepEqual(extend("command", ["token1", "token2"]), {
  tokens: ["token1", "token2"],
  source: null,
});

assertDeepEqual(extend("command", "source"), {
  tokens: null,
  source: "source",
});

// appmap_dir //

assertDeepEqual(
  extend("appmap_dir", "tmp/appmap", "file:///w:/base/"),
  "file:///w:/base/tmp/appmap/",
);

// exclude //

assertDeepEqual(
  extend("exclude", ["foo\\.bar"], undefined, "file:///w:/home/"),
  [
    {
      combinator: "and",
      "every-label": true,
      "some-label": true,
      name: true,
      "qualified-name": "foo\\.bar",
      excluded: true,
      recursive: true,
    },
    ...createConfiguration("file:///w:/home/").exclude,
  ],
);

// additional //

assertDeepEqual(extend("additional", "foo", "bar"), undefined);
