import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { createRequire } from "module";
import { mkdir, symlink, writeFile, realpath } from "fs/promises";
import { createAppmap } from "../../lib/node/recorder-manual.mjs";

Error.stackTraceLimit = Infinity;

const { cwd } = process;
const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;
const { stringify: stringifyJSON } = JSON;

const directory = joinPath(
  await realpath(tmpdir()),
  Math.random().toString(36).substring(2),
);

await mkdir(directory);
await mkdir(joinPath(directory, "node_modules"));
await mkdir(joinPath(directory, "node_modules", ".bin"));
await mkdir(joinPath(directory, "node_modules", "@appland"));
await symlink(
  cwd(),
  joinPath(directory, "node_modules", "@appland", "appmap-agent-js"),
);
await writeFile(
  joinPath(directory, "package.json"),
  stringifyJSON({
    name: "package",
    version: "1.2.3",
  }),
  "utf8",
);

const require = createRequire(joinPath(directory, "dummy.mjs"));
const appmap = createAppmap(
  directory,
  {
    name: "name",
    recorder: "manual",
    packages: "*",
    hooks: {
      esm: false,
      cjs: true,
      apply: true,
      http: false,
    },
    validate: {
      message: true,
      appmap: true,
    },
  },
  directory,
);

appmap.startTrack("track", { path: null, data: {} });

await writeFile(
  joinPath(directory, "common.js"),
  `exports.common = function common () { return "COMMON"; }`,
  "utf8",
);
{
  const { common } = require("./common.js");
  assertEqual(common(), "COMMON");
}
{
  const script = appmap.recordScript(
    joinPath(directory, "script.js"),
    `(function script () { return "SCRIPT"; });`,
  );
  assertEqual(script(), "SCRIPT");
}

const trace = appmap.stopTrack("track");

appmap.terminate();

assertDeepEqual(
  trace.events.map(({ event }) => event),
  ["call", "return", "call", "return"],
);
