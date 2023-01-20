import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { validateInternalConfiguration } from "../../validate/index.mjs";
import { matchSpecifier } from "../../specifier/index.mjs";
import { createConfiguration, extendConfiguration } from "./index.mjs";

const { undefined } = globalThis;

validateInternalConfiguration(createConfiguration("protocol://host/home/"));

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
    "protocol://host/base/",
  ),
  {
    directory: "protocol://host/base/agent/",
    package: {
      name: "appmap-agent-js",
      version: "1.2.3",
      homepage: null,
    },
  },
);

// default-package //
assertDeepEqual(extend("default-package", true, "protocol://host/base/"), {
  enabled: true,
  shallow: false,
  "inline-source": null,
  exclude: [],
});

// packages //

{
  const [specifier, value] = extend(
    "packages",
    "lib/*.js",
    "protocol://host/base/",
  )[0];
  assertDeepEqual(value, {
    "inline-source": null,
    enabled: true,
    exclude: [],
    shallow: false,
  });
  assertEqual(
    matchSpecifier(specifier, "protocol://host/base/lib/foo.js"),
    true,
  );
  assertEqual(
    matchSpecifier(specifier, "protocol://host/base/lib/foo.mjs"),
    false,
  );
  assertEqual(
    matchSpecifier(specifier, "protocol://host/base/src/foo.js"),
    false,
  );
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
    "protocol://host/base/",
  ),
  [
    {
      base: "protocol://host/base/",
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
    "protocol://host/base/conf.yml",
  ),
  {
    cwd: "protocol://host/base/",
    shell: false,
    encoding: "utf8",
    env: { FOO: "BAR" },
    stdio: "inherit",
    timeout: 123,
    killSignal: "SIGTERM",
  },
);

assertDeepEqual(
  extend("command-options", { cwd: "cwd" }, "protocol://host/base/"),
  {
    cwd: "protocol://host/base/cwd/",
    shell: false,
    encoding: "utf8",
    env: {},
    stdio: "inherit",
    timeout: 0,
    killSignal: "SIGTERM",
  },
);

// main //

assertDeepEqual(
  extend("main", "foo.js", "protocol://host/base/"),
  "protocol://host/base/foo.js",
);

// port //

assertDeepEqual(
  extend("trace-port", "unix-domain-socket", "protocol://host/base/"),
  "protocol://host/base/unix-domain-socket",
);

assertDeepEqual(extend("trace-port", "", "protocol://host/base/"), "");

assertDeepEqual(extend("trace-port", 8080, "protocol://host/base/"), 8080);

// language //

assertDeepEqual(extend("language", "javascript"), "javascript");

// log //

assertDeepEqual(extend("log", "warning"), {
  level: "warning",
  file: 2,
});

assertDeepEqual(extend("log", { file: "log" }, "protocol://host/base/"), {
  level: "error",
  file: "protocol://host/base/log",
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
  extend("processes", "/foo", "protocol://host/base/", "protocol://host/home"),
  [
    [
      { base: "protocol://host/base/", source: "^(?:\\/foo)$", flags: "" },
      true,
    ],
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
  extend("appmap_dir", "tmp/appmap", "protocol://host/base/"),
  "protocol://host/base/tmp/appmap/",
);

// exclude //

assertDeepEqual(
  extend("exclude", ["foo\\.bar"], undefined, "protocol://host/home/"),
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
    ...createConfiguration("protocol://host/home/").exclude,
  ],
);

// additional //

assertDeepEqual(extend("additional", "foo", "bar"), undefined);
