import { readFileSync } from "fs";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Storage from "./index.mjs";

const testAsync = async () => {
  const { createStorage, store, storeAsync } = Storage(
    await buildTestAsync(import.meta),
  );

  const storage = createStorage({
    output: { directory: tmpdir(), postfix: ".foo", indent: null },
  });

  const name = `appmap-storage-file-${Math.random().toString(36).substring(2)}`;

  store(storage, name, 123);
  Assert.equal(
    JSON.parse(readFileSync(`${tmpdir()}/${name}.foo.json`, "utf8")),
    123,
  );

  await storeAsync(storage, name, 456);
  Assert.equal(
    JSON.parse(readFileSync(`${tmpdir()}/${name}-1.foo.json`, "utf8")),
    456,
  );
};

testAsync();
