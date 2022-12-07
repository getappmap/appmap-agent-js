import { encode as encodeVLQ } from "vlq";
import SourceMap from "source-map";
import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import { makeLocation } from "../../location/index.mjs";
import {
  extractSourceMapUrl,
  createMirrorSourceMap,
  createSourceMap,
  mapSource,
  getSources,
} from "./index.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { SourceMapGenerator } = SourceMap;

assertThrow(
  () =>
    createSourceMap({
      url: "http://host/source-map.json",
      content: "INVALID JSON",
    }),
  /^ExternalAppmapError: Source map is not valid JSON$/u,
);

/////////////////////////
// extractSourceMapUrl //
/////////////////////////

assertEqual(
  extractSourceMapUrl({
    url: "data:,foo",
    content: "//# sourceMappingURL=http://host/source.map",
  }),
  "http://host/source.map",
);

assertEqual(
  extractSourceMapUrl({
    url: "http://host/directory/filename",
    content: `//@ sourceMappingURL=source.map\r\n`,
  }),
  "http://host/directory/source.map",
);

assertEqual(
  extractSourceMapUrl({
    url: "http:///host/directory/filename",
    content: "123;",
  }),
  null,
);

////////////
// Mirror //
////////////

{
  const mapping = createMirrorSourceMap({
    url: "http://host/out.js",
    content: "123;",
  });
  assertEqual(mapSource(mapping, 123, 456), "http://host/out.js#123-456");
  assertDeepEqual(getSources(mapping), [
    { url: "http://host/out.js", content: "123;" },
  ]);
}

////////////
// Normal //
////////////

{
  const generator = new SourceMapGenerator();
  generator.addMapping({
    source: "source.js",
    generated: { line: 3, column: 5 },
    original: { line: 7, column: 11 },
  });
  generator.addMapping({
    source: "source.js",
    generated: { line: 3, column: 13 },
    original: { line: 17, column: 19 },
  });
  const mapping = createSourceMap({
    url: "http://host/directory/map.json",
    content: generator.toString(),
  });
  assertEqual(
    mapSource(mapping, 3, 13),
    makeLocation("http://host/directory/source.js", { line: 17, column: 19 }),
  );
  assertEqual(mapSource(mapping, 3, 23), null);
  assertEqual(mapSource(mapping, 29, 0), null);
  assertDeepEqual(getSources(mapping), [
    { url: "http://host/directory/source.js", content: null },
  ]);
}

assertEqual(
  mapSource(
    createSourceMap({
      url: "http://host/directory/map.json",
      content: stringifyJSON({
        version: 3,
        sources: [],
        names: [],
        mappings: encodeVLQ([0, 0, 0, 0]),
      }),
    }),
    1,
    0,
  ),
  null,
);

assertDeepEqual(
  getSources(
    createSourceMap({
      url: "http://host/directory/map.json",
      content: stringifyJSON({
        version: 3,
        sourceRoot: "root",
        sources: ["source1.js", "source2.js"],
        contents: ["123;"],
        names: [],
        mappings: "",
      }),
    }),
  ),
  [
    { url: "http://host/directory/root/source1.js", content: "123;" },
    { url: "http://host/directory/root/source2.js", content: null },
  ],
);

assertDeepEqual(
  getSources(
    createSourceMap({
      url: "http://host/directory/map.json",
      content: stringifyJSON({
        version: 3,
        sources: ["source.js"],
        names: [],
        mappings: "",
      }),
    }),
  ),
  [{ url: "http://host/directory/source.js", content: null }],
);
