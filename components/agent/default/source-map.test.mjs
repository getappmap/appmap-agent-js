import { writeFile as writeFileAsync } from "node:fs/promises";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { getTmpUrl } from "../../path/index.mjs?env=test";
import { toAbsoluteUrl } from "../../url/index.mjs?env=test";
import { mapSource } from "../../source/index.mjs?env=test";
import { loadSourceMap } from "./source-map.mjs?env=test";

const {
  encodeURIComponent,
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

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

const url = toAbsoluteUrl(getUuid(), getTmpUrl());

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
