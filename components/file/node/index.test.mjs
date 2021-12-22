import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { join as joinPath } from "path";
import { pathToFileURL } from "url";
import { writeFile } from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import File from "./index.mjs";

const { equal: assertEqual } = Assert;

const { readFile, readFileAsync } = File(
  await buildTestDependenciesAsync(import.meta.url),
);

const path = joinPath(tmpdir(), Math.random().toString(36).substring(2));
await writeFile(path, "content", "utf8");
const url = pathToFileURL(path);
assertEqual(readFile(url), "content");
assertEqual(await readFileAsync(url), "content");
