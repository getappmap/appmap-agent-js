import { writeFile as writeFileAsync } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import {
  extendConfiguration,
  createConfiguration,
} from "../../configuration/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import {
  createMirrorMapping,
  mapSource,
  getMappingSourceArray,
} from "../../mapping/index.mjs";
import { fillSourceMap, loadSourceMap } from "./index.mjs";

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
  const configuration = extendConfiguration(
    createConfiguration(getTmpUrl()),
    {
      "default-package": { enabled: true },
    },
    getTmpUrl(),
  );
  const url = toAbsoluteUrl(getUuid(), getTmpUrl());
  const mapping = createMirrorMapping({ url, content: null });
  fillSourceMap(mapping, configuration);
  await writeFileAsync(new URL(url), "123;", "utf8");
  fillSourceMap(mapping, configuration);
  assertDeepEqual(getMappingSourceArray(mapping), [{ url, content: "123;" }]);
}

// no source map //
{
  const source = { url: "http://host/main.js", content: "123;" };
  const mapping = loadSourceMap(source, null);
  assertDeepEqual(mapSource(mapping, { line: 456, column: 789 }), {
    index: 0,
    position: {
      line: 456,
      column: 789,
    },
  });
}

// explicit source map //
assertEqual(
  mapSource(
    loadSourceMap(
      { url: "http://host/main.js", content: `123;` },
      {
        url: "http://host/map.json",
        content: empty_source_map,
      },
    ),
    { line: 456, column: 789 },
  ),
  null,
);

// inline source map //
assertEqual(
  mapSource(
    loadSourceMap(
      {
        url: "http://host/main.js",
        content: `123; //# sourceMappingURL=data:,${encodeURIComponent(
          stringifyJSON(empty_source_map),
        )}`,
      },
      null,
    ),
    { line: 456, column: 789 },
  ),
  null,
);

// external source map
{
  const url = toAbsoluteUrl(getUuid(), getTmpUrl());

  const source = {
    url: "http://host/main.js",
    content: `123; //# sourceMappingURL=${url}`,
  };

  // missing external source map
  assertDeepEqual(
    mapSource(loadSourceMap(source, null), { line: 456, column: 789 }),
    {
      index: 0,
      position: {
        line: 456,
        column: 789,
      },
    },
  );

  await writeFileAsync(new URL(url), stringifyJSON(empty_source_map), "utf8");

  // present external source map
  assertEqual(
    mapSource(
      loadSourceMap(
        {
          url: "http://host/main.js",
          content: `123; //# sourceMappingURL=${url}`,
        },
        null,
      ),
      { line: 456, column: 789 },
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
      { line: 1, column: 1 },
    ),
    {
      index: 0,
      position: {
        line: 2, // TODO: This is off by one. It should be 1, not 2.
        column: 1,
      },
    },
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
      { line: 456, column: 789 },
    ),
    null,
  );
}
