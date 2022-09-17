import { writeFile as writeFileAsync } from "node:fs/promises";
import { getFreshTemporaryURL, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import SourceMap from "./source-map.mjs";

const {
  encodeURIComponent,
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { loadSourceMap } = SourceMap(
  await buildTestDependenciesAsync(import.meta.url),
);
const { mapSource } = await buildTestComponentAsync("source");

assertDeepEqual(
  mapSource(
    loadSourceMap({
      url: "http://host/main.js",
      content: "123;",
    }),
    456,
    789,
  ),
  {
    url: "http://host/main.js",
    line: 456,
    column: 789,
  },
);

const mapping = {
  version: 3,
  sources: [],
  mappings: "",
  names: [],
};

assertDeepEqual(
  mapSource(
    loadSourceMap({
      url: "http://host/main.js",
      content: `123; //# sourceMappingURL=data:,${encodeURIComponent(
        stringifyJSON(mapping),
      )}`,
    }),
    456,
    789,
  ),
  null,
);

const url = getFreshTemporaryURL();

assertDeepEqual(
  mapSource(
    loadSourceMap({
      url: "http://host/main.js",
      content: `123; //# sourceMappingURL=${url}`,
    }),
    456,
    789,
  ),
  {
    url: "http://host/main.js",
    line: 456,
    column: 789,
  },
);

await writeFileAsync(new URL(url), stringifyJSON(mapping), "utf8");

assertDeepEqual(
  mapSource(
    loadSourceMap({
      url: "http://host/main.js",
      content: `123; //# sourceMappingURL=${url}`,
    }),
    456,
    789,
  ),
  null,
);
