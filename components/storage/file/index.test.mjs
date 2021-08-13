import { readFileSync } from "fs";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Storage from "./index.mjs";

const { equal: assertEqual } = Assert;

const { createStorage, store, storeAsync } = Storage(
  await buildTestDependenciesAsync(import.meta.url),
);

const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;

const storage = createStorage({
  output: { directory, postfix: ".foo", indent: null },
});

store(storage, "filename", 123);
assertEqual(
  JSON.parse(readFileSync(`${directory}/filename.foo.json`, "utf8")),
  123,
);

await storeAsync(storage, "filename", 456);
assertEqual(
  JSON.parse(readFileSync(`${directory}/filename-1.foo.json`, "utf8")),
  456,
);
