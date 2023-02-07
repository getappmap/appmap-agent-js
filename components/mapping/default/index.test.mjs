import { encode as encodeVLQ } from "vlq";
import SourceMap from "source-map";
import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import { hashFile } from "../../hash/index.mjs";
import {
  extractMappingUrl,
  createMirrorMapping,
  createMapping,
  mapSource,
  getMappingSourceArray,
} from "./index.mjs";

const { SourceMapGenerator } = SourceMap;

assertThrow(
  () =>
    createMapping({
      url: "http://host/source-map.json",
      content: "INVALID JSON",
    }),
  /^ExternalAppmapError: Source map is not valid JSON$/u,
);

///////////////////////
// extractMappingUrl //
///////////////////////

assertEqual(
  extractMappingUrl({
    url: "data:,foo",
    content: "//# sourceMappingURL=http://host/source.map",
  }),
  "http://host/source.map",
);

assertEqual(
  extractMappingUrl({
    url: "http://host/directory/filename",
    content: `//@ sourceMappingURL=source.map\r\n\t`,
  }),
  "http://host/directory/source.map",
);

assertEqual(
  extractMappingUrl({
    url: "http:///host/directory/filename",
    content: "123;",
  }),
  null,
);

////////////
// Mirror //
////////////

{
  const file = {
    url: "http://host/out.js",
    content: "123;",
  };
  const hash = hashFile(file);
  const mapping = createMirrorMapping(file);
  assertDeepEqual(mapSource(mapping, 123, 456), {
    url: file.url,
    hash,
    line: 123,
    column: 456,
  });
  assertDeepEqual(getMappingSourceArray(mapping), [
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
  const mapping = createMapping({
    url: "http://host/directory/map.json",
    content: generator.toString(),
  });
  assertDeepEqual(mapSource(mapping, 3, 13), {
    url: "http://host/directory/source.js",
    hash: null,
    line: 17,
    column: 19,
  });
  assertEqual(mapSource(mapping, 3, 23), null);
  assertEqual(mapSource(mapping, 29, 0), null);
  assertDeepEqual(getMappingSourceArray(mapping), [
    {
      url: "http://host/directory/source.js",
      content: null,
    },
  ]);
}

assertEqual(
  mapSource(
    createMapping({
      url: "http://host/directory/map.json",
      content: {
        version: 3,
        sources: [],
        names: [],
        mappings: encodeVLQ([0, 0, 0, 0]),
      },
    }),
    1,
    0,
  ),
  null,
);

assertDeepEqual(
  getMappingSourceArray(
    createMapping({
      url: "http://host/directory/map.json",
      content: {
        version: 3,
        sourceRoot: "root",
        sources: ["source1.js", "source2.js"],
        sourcesContent: ["123;"],
        names: [],
        mappings: "",
      },
    }),
  ),
  [
    {
      url: "http://host/directory/root/source1.js",
      content: "123;",
    },
    {
      url: "http://host/directory/root/source2.js",
      content: null,
    },
  ],
);

assertDeepEqual(
  getMappingSourceArray(
    createMapping({
      url: "http://host/directory/map.json",
      content: {
        version: 3,
        sources: ["source.js"],
        names: [],
        mappings: "",
      },
    }),
  ),
  [
    {
      url: "http://host/directory/source.js",
      content: null,
    },
  ],
);
