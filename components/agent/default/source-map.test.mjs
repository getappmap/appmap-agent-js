import { writeFile as writeFileAsync } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { assertEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { makeLocation } from "../../location/index.mjs";
import { mapSource } from "../../source/index.mjs";
import { loadSourceMap } from "./source-map.mjs";

const {
  Boolean,
  encodeURIComponent,
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

assertEqual(
  mapSource(
    loadSourceMap(
      {
        url: "http://host/main.js",
        content: "123;",
      },
      null,
    ),
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
    loadSourceMap(
      {
        url: "http://host/main.js",
        content: `123;`,
      },
      {
        url: "http://host/map.json",
        content: mapping,
      },
    ),
    456,
    789,
  ),
  null,
);

assertEqual(
  mapSource(
    loadSourceMap(
      {
        url: "http://host/main.js",
        content: `123; //# sourceMappingURL=data:,${encodeURIComponent(
          stringifyJSON(mapping),
        )}`,
      },
      null,
    ),
    456,
    789,
  ),
  null,
);

const url = toAbsoluteUrl(getUuid(), getTmpUrl());

assertEqual(
  mapSource(
    loadSourceMap(
      {
        url: "http://host/main.js",
        content: `123; //# sourceMappingURL=${url}`,
      },
      null,
    ),
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
    loadSourceMap(
      {
        url: "http://host/main.js",
        content: `123; //# sourceMappingURL=${url}`,
      },
      null,
    ),
    456,
    789,
  ),
  null,
);

const inlineSourceMapData = Buffer.from(
  stringifyJSON({
    version: 3,
    sources: ["http://host/main.js"],
    mappings: "CACCA;",
    names: ["nop"],
  }),
  "utf-8",
).toString("base64");

const buildInlineSourceMap = (mediaType, encoding, data) =>
  ["data:", mediaType, encoding && `;${encoding}`, ",", data]
    .filter(Boolean)
    .join("");

// Proper handling of inline source maps.
assertEqual(
  mapSource(
    loadSourceMap(
      {
        url: "http://host/main.js",
        content: `() => {}; //# sourceMappingURL=${buildInlineSourceMap(
          "application/json",
          "base64",
          inlineSourceMapData,
        )}`,
      },
      null,
    ),
    1,
    1,
  ),
  makeLocation("http://host/main.js", {
    line: 2, // TODO: This is off by one. It should be 1, not 2.
    column: 1,
  }),
);

// Invalid encoding should be rejected, returning null.
assertEqual(
  mapSource(
    loadSourceMap(
      {
        url: "http://host/main.js",
        content: `123; //# sourceMappingURL=${buildInlineSourceMap(
          "image/png",
          "base64",
          inlineSourceMapData,
        )}`,
      },
      null,
    ),
    456,
    789,
  ),
  null,
);
