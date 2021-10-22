import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { writeFile as writeFileAsync } from "fs/promises";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import File from "./file.mjs";

const { deepEqual: assertDeepEqual, ok: assert } = Assert;

const { readFile, readFileAsync } = File(
  await buildTestDependenciesAsync(import.meta.url),
);
const { isLeft, makeRight } = await buildTestComponentAsync("util");

const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
const url = `file://${path}`;
assert(isLeft(await readFileAsync(url)));
assert(isLeft(readFile(url)));

await writeFileAsync(path, "foo", "utf8");
assertDeepEqual(
  await readFileAsync(url),
  makeRight({
    url,
    content: "foo",
  }),
);
assertDeepEqual(
  readFile(url),
  makeRight({
    url,
    content: "foo",
  }),
);
