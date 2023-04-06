import { encode as encodeVLQ } from "vlq";
import SourceMap from "source-map";
import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import { digest } from "../../hash/index.mjs";
import {
  extractMappingUrl,
  createMirrorMapping,
  createMapping,
  mapSource,
  getMappingSourceArray,
  updateMappingSource,
} from "./index.mjs";

const { undefined } = globalThis;

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
  const source1 = { url: "http://host/out.js", content: "123;" };
  const mapping = createMirrorMapping(source1);
    url: source1.url,
    hash: digest("123;"),
  assertDeepEqual(mapSource(mapping, { line: 123, column: 456 }), {
    position: {
      line: 123,
      column: 456,
    },
  });
  assertDeepEqual(getMappingSourceArray(mapping), [source1]);
  const source2 = { url: "http://host/out.js", content: "456;" };
  assertEqual(updateMappingSource(mapping, source2), undefined);
  assertDeepEqual(getMappingSourceArray(mapping), [source2]);
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
    url: "http://host/directory/source.js",
    hash: null,
  assertDeepEqual(mapSource(mapping, { line: 3, column: 13 }), {
    position: {
      line: 17,
      column: 19,
    },
  });
  assertEqual(mapSource(mapping, { line: 3, column: 23 }), null);
  assertEqual(mapSource(mapping, { line: 29, column: 0 }), null);
  assertDeepEqual(getMappingSourceArray(mapping), [
    { url: "http://host/directory/source.js", content: null },
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

{
  const mapping = createMapping({
    url: "http://host/directory/map.json",
    content: {
      version: 3,
      sourceRoot: "root",
      sources: ["source1.js", "source2.js"],
      sourcesContent: ["123;"],
      names: [],
      mappings: "",
    },
  });
  assertDeepEqual(getMappingSourceArray(mapping), [
    {
      url: "http://host/directory/root/source1.js",
      content: "123;",
    },
    { url: "http://host/directory/root/source2.js", content: null },
  ]);
  assertEqual(
    updateMappingSource(mapping, {
      url: "http://host/directory/root/source2.js",
      content: "456;",
    }),
    undefined,
  );
  assertDeepEqual(getMappingSourceArray(mapping), [
    {
      url: "http://host/directory/root/source1.js",
      content: "123;",
    },
    {
      url: "http://host/directory/root/source2.js",
      content: "456;",
    },
  ]);
}

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
  [{ url: "http://host/directory/source.js", content: null }],
);
