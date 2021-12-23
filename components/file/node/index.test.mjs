import { getFreshTemporaryPath, assertEqual } from "../../__fixture__.mjs";
import { pathToFileURL } from "url";
import { writeFile } from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import File from "./index.mjs";

const { readFile, readFileAsync } = File(
  await buildTestDependenciesAsync(import.meta.url),
);

const path = getFreshTemporaryPath();
await writeFile(path, "content", "utf8");
const url = pathToFileURL(path);
assertEqual(readFile(url), "content");
assertEqual(await readFileAsync(url), "content");
