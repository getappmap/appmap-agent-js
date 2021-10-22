import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { writeFile as writeFileAsync, mkdir as mkdirAsync } from "fs/promises";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import SourceOuter from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const { getSources } = await buildTestComponentAsync("source");
const { extractSourceMap, extractSourceMapAsync } = SourceOuter(
  await buildTestDependenciesAsync(import.meta.url),
);

{
  const file = {
    url: "file:///script.js",
    content: "123;",
  };
  assertDeepEqual(getSources(extractSourceMap(file)), [file]);
  assertDeepEqual(getSources(await extractSourceMapAsync(file)), [file]);
}

{
  const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
  await mkdirAsync(directory);
  const file = {
    url: `file://${directory}/script.js`,
    content: "789; //# sourceMappingURL=source.map",
  };
  const sources = [
    { url: `file://${directory}/source1.js`, content: "123;" },
    { url: `file://${directory}/source2.js`, content: "456;" },
  ];
  assertDeepEqual(getSources(extractSourceMap(file)), [file]);
  assertDeepEqual(getSources(await extractSourceMapAsync(file)), [file]);
  await writeFileAsync(
    `${directory}/source.map`,
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
  assertDeepEqual(getSources(await extractSourceMapAsync(file)), [file]);
  await writeFileAsync(`${directory}/source2.js`, "456;", "utf8");
  assertDeepEqual(getSources(extractSourceMap(file)), sources);
  assertDeepEqual(getSources(await extractSourceMapAsync(file)), sources);
}
