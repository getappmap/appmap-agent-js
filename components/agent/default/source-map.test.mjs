import { writeFile as writeFileAsync } from "node:fs/promises";
import { assertEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { makeLocation } from "../../location/index.mjs";
import { mapSource } from "../../source/index.mjs";
import { loadSourceMap } from "./source-map.mjs";

const {
  encodeURIComponent,
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

assertEqual(
  mapSource(
    loadSourceMap({
      url: "http://host/main.js",
      content: "123;",
    }),
    456,
    789,
  ),
  makeLocation("http://host/main.js", {
    line: 456,
    column: 789,
  }),
);

const mapping = {
  version: 3,
  sources: [],
  mappings: "",
  names: [],
};

assertEqual(
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

const url = toAbsoluteUrl(getUuid(), getTmpUrl());

assertEqual(
  mapSource(
    loadSourceMap({
      url: "http://host/main.js",
      content: `123; //# sourceMappingURL=${url}`,
    }),
    456,
    789,
  ),
  makeLocation("http://host/main.js", {
    line: 456,
    column: 789,
  }),
);

await writeFileAsync(new URL(url), stringifyJSON(mapping), "utf8");

assertEqual(
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
