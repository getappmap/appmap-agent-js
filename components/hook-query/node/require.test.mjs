import { strict as Assert } from "assert";
import { mkdir as mkdirAsync, writeFile as writeFileAsync } from "fs/promises";
import { tmpdir } from "os";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Require from "./require.mjs";

const {
  // ok: assert,
  equal: assertEqual,
  // notEqual: assertNotEqual,
  // deepEqual: assertDeepEqual,
} = Assert;

const { requireMaybe } = Require(
  await buildTestDependenciesAsync(import.meta.url),
);

const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;

await mkdirAsync(directory);

await mkdirAsync(`${directory}/node_modules`);

await mkdirAsync(`${directory}/node_modules/foo`);

await writeFileAsync(
  `${directory}/node_modules/foo/package.json`,
  JSON.stringify({
    name: "foo",
    version: "1.2.3",
  }),
  "utf8",
);

await writeFileAsync(
  `${directory}/node_modules/foo/index.js`,
  "module.exports = 123;",
  "utf8",
);

assertEqual(requireMaybe(true, directory, "foo"), 123);

assertEqual(requireMaybe(false, directory, "foo"), null);

assertEqual(
  requireMaybe(true, directory, Math.random().toString(36).substring(2)),
  null,
);
