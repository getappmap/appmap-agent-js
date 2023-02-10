import { encode as encodeVLQ } from "vlq";
import SourceMap from "source-map";
import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import { createSource, makeSourceLocation } from "../../source/index.mjs";
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
  extractMappingUrl(
    createSource("data:,foo", "//# sourceMappingURL=http://host/source.map"),
  ),
  "http://host/source.map",
);

assertEqual(
  extractMappingUrl(
    createSource(
      "http://host/directory/filename",
      `//@ sourceMappingURL=source.map\r\n\t`,
    ),
  ),
  "http://host/directory/source.map",
);

assertEqual(
  extractMappingUrl(createSource("http:///host/directory/filename", "123;")),
  null,
);

////////////
// Mirror //
////////////

{
  const source1 = createSource("http://host/out.js", "123;");
  const mapping = createMirrorMapping(source1);
  assertDeepEqual(
    mapSource(mapping, 123, 456),
    makeSourceLocation(source1, 123, 456),
  );
  assertDeepEqual(getMappingSourceArray(mapping), [source1]);
  const source2 = createSource("http://host/out.js", "456;");
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
  assertDeepEqual(mapSource(mapping, 3, 13), {
    url: "http://host/directory/source.js",
    hash: null,
    line: 17,
    column: 19,
  });
  assertEqual(mapSource(mapping, 3, 23), null);
  assertEqual(mapSource(mapping, 29, 0), null);
  assertDeepEqual(getMappingSourceArray(mapping), [
    createSource("http://host/directory/source.js", null),
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
    createSource("http://host/directory/root/source1.js", "123;"),
    createSource("http://host/directory/root/source2.js", null),
  ]);
  assertEqual(
    updateMappingSource(
      mapping,
      createSource("http://host/directory/root/source2.js", "456;"),
    ),
    undefined,
  );
  assertDeepEqual(getMappingSourceArray(mapping), [
    createSource("http://host/directory/root/source1.js", "123;"),
    createSource("http://host/directory/root/source2.js", "456;"),
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
  [createSource("http://host/directory/source.js", null)],
);
