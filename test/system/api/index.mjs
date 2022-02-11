import { tmpdir } from "os";
import { pathToFileURL } from "url";
import { strict as Assert } from "assert";
import { createRequire } from "module";
import {
  mkdir as mkdirAsync,
  symlink as symlinkAsync,
  writeFile as writeFileAsync,
  realpath as realpathAsync,
} from "fs/promises";
import { createAppMap } from "../../../lib/node/recorder-api.mjs";

Error.stackTraceLimit = Infinity;

const { cwd } = process;
const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;
const { stringify: stringifyJSON } = JSON;

const directory = `${pathToFileURL(
  await realpathAsync(tmpdir()),
)}/${Math.random().toString(36).substring(2)}`;

await mkdirAsync(new URL(directory));
await mkdirAsync(new URL(`${directory}/node_modules`));
await mkdirAsync(new URL(`${directory}/node_modules/.bin`));
await mkdirAsync(new URL(`${directory}/node_modules/@appland`));
await symlinkAsync(
  cwd(),
  new URL(`${directory}/node_modules/@appland/appmap-agent-js`),
);
await writeFileAsync(
  new URL(`${directory}/package.json`),
  stringifyJSON({
    name: "package",
    version: "1.2.3",
  }),
  "utf8",
);

const require = createRequire(new URL(`${directory}/dummy.mjs`));
const appmap = createAppMap(
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

appmap.startRecording("track");

await writeFileAsync(
  new URL(`${directory}/common.js`),
  `exports.common = function common () { return "COMMON"; }`,
  "utf8",
);
{
  const { common } = require("./common.js");
  assertEqual(common(), "COMMON");
}
{
  const script = appmap.recordScript(
    `(function script () { return "SCRIPT"; });`,
    `${directory}/script.js`,
  );
  assertEqual(script(), "SCRIPT");
}

const trace = appmap.stopRecording("track");

appmap.terminate();

assertDeepEqual(
  trace.events.map(({ event }) => event),
  ["call", "return", "call", "return"],
);
