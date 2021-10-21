import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { writeFile as writeFileAsync } from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import File from "./file.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const { readFile, readFileAsync } = File(
  await buildTestDependenciesAsync(import.meta.url),
);

const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
const url = `file://${path}`;
await writeFileAsync(path, "foo", "utf8");
assertDeepEqual(await readFileAsync(url), {
  url,
  content: "foo",
});
assertDeepEqual(readFile(`file://${path}`), {
  url,
  content: "foo",
});
