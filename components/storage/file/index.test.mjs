import { readFileSync } from "fs";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Storage from "./index.mjs";

const { equal: assertEqual } = Assert;

const { createStorage, store, storeAsync } = Storage(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");

const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;

const configuration = extendConfiguration(createConfiguration("/cwd"), {
  output: {
    directory,
    postfix: ".foo",
  },
});

const storage = createStorage();

store(storage, configuration, 123);
assertEqual(
  JSON.parse(readFileSync(`${directory}/anonymous.foo.json`, "utf8")),
  123,
);

await storeAsync(storage, configuration, 456);
assertEqual(
  JSON.parse(readFileSync(`${directory}/anonymous-1.foo.json`, "utf8")),
  456,
);
