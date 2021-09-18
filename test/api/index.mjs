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

const appmap = createAppmap(
  directory,
  {
    output: {
      directory: ".",
      filename: "filename",
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

const recorder = appmap.start();

const require = createRequire(`${directory}/dummy.mjs`);
await writeFile(
  `${directory}/main.js`,
  `exports.main = function main () { return "MAIN"; }`,
  "utf8",
);

const { main } = require("./main.js");
assertEqual(main(), "MAIN");

recorder.stop({errors: [], status:0});
appmap.terminate();

const { events } = parseJSON(
  await readFile(`${directory}/filename.appmap.json`, "utf8"),
);

assertDeepEqual(
  events.map(({ event }) => event),
  ["call", "return"],
);
