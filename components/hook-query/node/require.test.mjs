import { getFreshTemporaryURL, assertEqual } from "../../__fixture__.mjs";
import { mkdir as mkdirAsync, writeFile as writeFileAsync } from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Require from "./require.mjs";

const {
  URL,
  Math: {random},
  JSON: {stringify:stringifyJSON},
} = globalThis;

const { requireMaybe } = Require(
  await buildTestDependenciesAsync(import.meta.url),
);

const directory = getFreshTemporaryURL();

await mkdirAsync(new URL(directory));

await mkdirAsync(new URL(`${directory}/node_modules`));

await mkdirAsync(new URL(`${directory}/node_modules/foo`));

await writeFileAsync(
  new URL(`${directory}/node_modules/foo/package.json`),
  stringifyJSON({
    name: "foo",
    version: "1.2.3",
  }),
  "utf8",
);

await writeFileAsync(
  new URL(`${directory}/node_modules/foo/index.js`),
  "module.exports = 123;",
  "utf8",
);

assertEqual(requireMaybe(true, directory, "foo"), 123);

assertEqual(requireMaybe(false, directory, "foo"), null);

assertEqual(
  requireMaybe(true, directory, random().toString(36).substring(2)),
  null,
);
