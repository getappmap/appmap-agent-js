import { getFreshTemporaryURL, assertDeepEqual } from "../../__fixture__.mjs";
import { writeFile as writeFileAsync, mkdir as mkdirAsync } from "fs/promises";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import SourceOuter from "./index.mjs";

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
  const url = getFreshTemporaryURL();
  await mkdirAsync(new URL(url));
  const file = {
    url: `${url}/script.js`,
    content: "789; //# sourceMappingURL=source.map",
  };
  const sources = [
    {
      url: `${url}/source1.js`,
      content: "123;",
    },
    {
      url: `${url}/source2.js`,
      content: "456;",
    },
  ];
  assertDeepEqual(getSources(extractSourceMap(file)), [file]);
  await writeFileAsync(
    new URL(`${url}/source.map`),
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
  await writeFileAsync(new URL(`${url}/source2.js`), "456;", "utf8");
  assertDeepEqual(getSources(extractSourceMap(file)), sources);
}
