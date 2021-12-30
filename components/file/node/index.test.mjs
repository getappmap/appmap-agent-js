import { getFreshTemporaryURL, assertEqual } from "../../__fixture__.mjs";
import { writeFile as writeFileAsync } from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import File from "./index.mjs";

const { readFile, readFileAsync } = File(
  await buildTestDependenciesAsync(import.meta.url),
);

const url = getFreshTemporaryURL();
await writeFileAsync(new URL(url), "content", "utf8");
assertEqual(readFile(url), "content");
assertEqual(await readFileAsync(url), "content");
