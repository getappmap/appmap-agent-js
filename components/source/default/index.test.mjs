import { encode as encodeVLQ } from "vlq";
import SourceMap from "source-map";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  extractSourceMapURL,
  createMirrorSourceMap,
  createSourceMap,
  mapSource,
  getSources,
} from "./index.mjs?env=test";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { SourceMapGenerator } = SourceMap;

/////////////////////////
// extractSourceMapURL //
/////////////////////////

assertEqual(
  extractSourceMapURL({
    url: "data:,foo",
    content: "//# sourceMappingURL=http://host/source.map",
  }),
  "http://host/source.map",
);

assertEqual(
  extractSourceMapURL({
    url: "http://host/directory/filename",
    content: `//@ sourceMappingURL=source.map\r\n`,
  }),
  "http://host/directory/source.map",
);

assertEqual(
  extractSourceMapURL({
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
  assertDeepEqual(mapSource(mapping, 123, 456), {
    url: "http://host/out.js",
    line: 123,
    column: 456,
  });
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
  assertDeepEqual(mapSource(mapping, 3, 13), {
    url: "http://host/directory/source.js",
    line: 17,
    column: 19,
  });
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
        sourceRoot: "root/",
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
