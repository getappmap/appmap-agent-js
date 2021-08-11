import { readFileSync } from "fs";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Storage from "./index.mjs";

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const { createStorage, store, storeAsync } = Storage(
    await buildTestDependenciesAsync(import.meta.url),
  );

  const storage = createStorage({
    output: { directory: tmpdir(), postfix: ".foo", indent: null },
  });

  const name = `appmap-storage-file-${Math.random().toString(36).substring(2)}`;

  store(storage, name, 123);
  assertEqual(
    JSON.parse(readFileSync(`${tmpdir()}/${name}.foo.json`, "utf8")),
    123,
  );

  await storeAsync(storage, name, 456);
  assertEqual(
    JSON.parse(readFileSync(`${tmpdir()}/${name}-1.foo.json`, "utf8")),
    456,
  );
};

testAsync();
