import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { writeFile as writeFileAsync, mkdir as mkdirAsync } from "fs/promises";
import { join as joinPath } from "path";
import { pathToFileURL } from "url";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import SourceOuter from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const { getSources } = await buildTestComponentAsync("source");
const { extractSourceMap } = SourceOuter(
  await buildTestDependenciesAsync(import.meta.url),
);

{
  const file = {
    url: "file:///script.js",
    content: "123;",
  };
  assertDeepEqual(getSources(extractSourceMap(file)), [file]);
}

{
  const directory = joinPath(tmpdir(), Math.random().toString(36).substring(2));
  await mkdirAsync(directory);
  const file = {
    url: pathToFileURL(joinPath(directory, "script.js")).toString(),
    content: "789; //# sourceMappingURL=source.map",
  };
  const sources = [
    {
      url: pathToFileURL(joinPath(directory, "source1.js")).toString(),
      content: "123;",
    },
    {
      url: pathToFileURL(joinPath(directory, "source2.js")).toString(),
      content: "456;",
    },
  ];
  assertDeepEqual(getSources(extractSourceMap(file)), [file]);
  await writeFileAsync(
    joinPath(directory, "source.map"),
    JSON.stringify({
      version: 3,
      sources: ["source1.js", "source2.js"],
      sourcesContent: ["123;"],
      names: [],
      mappings: "",
    }),
    "utf8",
  );
  assertDeepEqual(getSources(extractSourceMap(file)), [file]);
  await writeFileAsync(joinPath(directory, "source2.js"), "456;", "utf8");
  assertDeepEqual(getSources(extractSourceMap(file)), sources);
}
