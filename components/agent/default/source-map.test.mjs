import { writeFile as writeFileAsync } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { createSource, makeSourceLocation } from "../../source/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import {
  createMirrorMapping,
  mapSource,
  getMappingSourceArray,
} from "../../mapping/index.mjs";
import { fillSourceMap, loadSourceMap } from "./source-map.mjs";

const {
  Boolean,
  encodeURIComponent,
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const empty_source_map = {
  version: 3,
  sources: [],
  mappings: "",
  names: [],
};

{
  const url = toAbsoluteUrl(getUuid(), getTmpUrl());
  await writeFileAsync(new URL(url), "123;", "utf8");
  const mapping = createMirrorMapping(createSource(url, null));
  fillSourceMap(mapping);
  assertDeepEqual(getMappingSourceArray(mapping), [createSource(url, "123;")]);
}

// no source map //
{
  const source = createSource("http://host/main.js", "123;");
  const mapping = loadSourceMap(source, null);
  assertDeepEqual(
    mapSource(mapping, 456, 789),
    makeSourceLocation(source, 456, 789),
  );
}

// explicit source map //
assertEqual(
  mapSource(
    loadSourceMap(createSource("http://host/main.js", `123;`), {
      url: "http://host/map.json",
      content: empty_source_map,
    }),
    456,
    789,
  ),
  null,
);

// inline source map //
assertEqual(
  mapSource(
    loadSourceMap(
      createSource(
        "http://host/main.js",
        `123; //# sourceMappingURL=data:,${encodeURIComponent(
          stringifyJSON(empty_source_map),
        )}`,
      ),
      null,
    ),
    456,
    789,
  ),
  null,
);

// external source map
{
  const url = toAbsoluteUrl(getUuid(), getTmpUrl());

  const source = createSource(
    "http://host/main.js",
    `123; //# sourceMappingURL=${url}`,
  );

  // missing external source map
  assertDeepEqual(
    mapSource(loadSourceMap(source, null), 456, 789),
    makeSourceLocation(source, 456, 789),
  );

  await writeFileAsync(new URL(url), stringifyJSON(empty_source_map), "utf8");

  // present external source map
  assertEqual(
    mapSource(
      loadSourceMap(
        createSource("http://host/main.js", `123; //# sourceMappingURL=${url}`),
        null,
      ),
      456,
      789,
    ),
    null,
  );
}

// Inline Source Map //
{
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
  assertDeepEqual(
    mapSource(
      loadSourceMap(
        createSource(
          "http://host/main.js",
          `() => {}; //# sourceMappingURL=${buildInlineSourceMap(
            "application/json",
            "base64",
            inlineSourceMapData,
          )}`,
        ),
        null,
      ),
      1,
      1,
    ),
    {
      url: "http://host/main.js",
      hash: null,
      line: 2, // TODO: This is off by one. It should be 1, not 2.
      column: 1,
    },
  );

  // Invalid encoding should be rejected, returning null.
  assertEqual(
    mapSource(
      loadSourceMap(
        createSource(
          "http://host/main.js",
          `123; //# sourceMappingURL=${buildInlineSourceMap(
            "image/png",
            "base64",
            inlineSourceMapData,
          )}`,
        ),
        null,
      ),
      456,
      789,
    ),
    null,
  );
}
