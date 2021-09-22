import { readFileSync } from "fs";
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Storage from "./index.mjs";

const { equal: assertEqual } = Assert;

const { store } = Storage(await buildTestDependenciesAsync(import.meta.url));

const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;

store({ path: `${directory}/filename.json`, data: 123 });
assertEqual(
  JSON.parse(readFileSync(`${directory}/filename.json`, "utf8")),
  123,
);
