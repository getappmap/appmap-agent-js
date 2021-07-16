import { readFileSync } from "fs";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import * as Util from "../../util/common/index.mjs";
import Expect from "../../expect/error/index.mjs";
import Storage from "./index.mjs";

const { getUniqueIdentifier } = Util;

const { createStorage, store, storeAsync } = Storage({
  Expect: Expect({ Util }),
});

const storage = createStorage({ directory: tmpdir(), postfix: ".foo" });

const name = getUniqueIdentifier();

store(storage, name, 123);
Assert.equal(
  JSON.parse(readFileSync(`${tmpdir()}/${name}.foo.json`, "utf8")),
  123,
);
storeAsync(storage, name, 456)
  .then(() => {
    Assert.equal(
      JSON.parse(readFileSync(`${tmpdir()}/${name}-1.foo.json`, "utf8")),
      456,
    );
  })
  .catch((error) => {
    throw error;
  });
