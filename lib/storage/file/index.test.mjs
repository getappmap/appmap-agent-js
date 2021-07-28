import { readFileSync } from "fs";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Storage from "./index.mjs";

const mainAsync = async () => {
  const { createStorage, store, storeAsync } = Storage(
    await buildAsync({ violation: "error", assert: "debug", util: "default" }),
  );

  const storage = createStorage({ directory: tmpdir(), postfix: ".foo" });

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

mainAsync();
