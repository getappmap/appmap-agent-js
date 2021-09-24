import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { createRequire } from "module";
import { mkdir, symlink, writeFile, realpath, readFile } from "fs/promises";
import { createAppmap } from "../../lib/manual.mjs";

Error.stackTraceLimit = Infinity;

const { cwd } = process;
const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;
const { stringify: stringifyJSON, parse: parseJSON } = JSON;

const directory = `${await realpath(tmpdir())}/${Math.random()
  .toString(36)
  .substring(2)}`;

await mkdir(directory);
await mkdir(`${directory}/node_modules`);
await mkdir(`${directory}/node_modules/.bin`);
await mkdir(`${directory}/node_modules/@appland`);
await symlink(cwd(), `${directory}/node_modules/@appland/appmap-agent-js`);
await writeFile(
  `${directory}/package.json`,
  stringifyJSON({
    name: "package",
    version: "1.2.3",
  }),
  "utf8",
);

const require = createRequire(`${directory}/dummy.mjs`);
const appmap = createAppmap(
  directory,
  {
    output: {
      directory: ".",
      basename: "basename",
    },
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

appmap.startStoredTrack("track1");
appmap.startTrack("track2");

await writeFile(
  `${directory}/common.js`,
  `exports.common = function common () { return "COMMON"; }`,
  "utf8",
);
{
  const { common } = require("./common.js");
  assertEqual(common(), "COMMON");
}
{
  const script = appmap.recordScript(
    `${directory}/script.js`,
    `(function script () { return "SCRIPT"; });`,
  );
  assertEqual(script(), "SCRIPT");
}

const trace2 = appmap.stopTrack("track2");
appmap.stopStoredTrack("track1");
appmap.terminate();

const trace1 = parseJSON(
  await readFile(`${directory}/basename.appmap.json`, "utf8"),
);

assertDeepEqual(trace1, trace2);

assertDeepEqual(
  trace1.events.map(({ event }) => event),
  ["call", "return", "call", "return"],
);
