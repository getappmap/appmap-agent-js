import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { writeFile } from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import SourceMap from "./index.mjs";

const {
  // ok: assert,
  equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { loadSourceMap } = SourceMap(dependencies);

assertEqual(loadSourceMap(null), null);

const path = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
await writeFile(path, "[123]", "utf8");

assertDeepEqual(loadSourceMap(`file://${path}`), [123]);
