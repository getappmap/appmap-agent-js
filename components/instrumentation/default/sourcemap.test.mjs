import SourceMap from "source-map";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  extractSourcemapUrl,
  parseSourcemap,
  compileSourcemap,
  mapPosition,
} from "./sourcemap.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { SourceMapGenerator } = SourceMap;

///////////////////////
// extractSourcemapUrl //
///////////////////////

assertEqual(
  extractSourcemapUrl({
    url: "data:,foo",
    content: "//# sourceMappingURL=http://host/map.json",
  }),
  "http://host/map.json",
);

assertEqual(
  extractSourcemapUrl({
    url: "http://host/directory/script.js",
    content: `//@ sourceMappingURL=map.json\r\n\t`,
  }),
  "http://host/directory/map.json",
);

assertEqual(
  extractSourcemapUrl({
    url: "http:///host/directory/script.js",
    content: "123;",
  }),
  null,
);

////////////////////
// parseSourcemap //
////////////////////

assertEqual(
  parseSourcemap(
    {
      url: "http://host/map.json",
      content: "INVALID JSON",
    },
    "http://host/script.js",
  ),
  null,
);

assertEqual(
  parseSourcemap(
    {
      url: "http://host/map.json",
      content: '"INVALID SOURCE MAP FORMAT"',
    },
    "http://host/script.js",
  ),
  null,
);

assertDeepEqual(
  parseSourcemap(
    {
      url: "http://host/directory/map.json",
      content: stringifyJSON({
        version: 3,
        file: "script.js",
        sourceRoot: "root",
        sources: ["source1.js", "source2.js"],
        sourcesContent: ["123;", "456;"],
        names: [],
        mappings: "A,AAAB;;ABCDE;",
      }),
    },
    "http://host/script.js",
  ),
  {
    sources: [
      {
        url: "http://host/directory/root/source1.js",
        content: "123;",
      },
      {
        url: "http://host/directory/root/source2.js",
        content: "456;",
      },
    ],
    payload: "A,AAAB;;ABCDE;",
  },
);

assertDeepEqual(
  parseSourcemap(
    {
      url: "http://host/directory/map.json",
      content: stringifyJSON({
        version: 3,
        file: null,
        sourceRoot: null,
        sources: ["source1.js", "source2.js"],
        sourcesContent: null,
        names: [],
        mappings: "A,AAAB;;ABCDE;",
      }),
    },
    "http://host/script.js",
  ),
  {
    sources: [
      {
        url: "http://host/directory/source1.js",
        content: null,
      },
      {
        url: "http://host/directory/source2.js",
        content: null,
      },
    ],
    payload: "A,AAAB;;ABCDE;",
  },
);

assertDeepEqual(
  parseSourcemap(
    {
      url: "http://host/directory/map.json",
      content: stringifyJSON({
        version: 3,
        sources: ["source1.js", "source2.js"],
        mappings: "A,AAAB;;ABCDE;",
        names: [],
      }),
    },
    "http://host/script.js",
  ),
  {
    sources: [
      {
        url: "http://host/directory/source1.js",
        content: null,
      },
      {
        url: "http://host/directory/source2.js",
        content: null,
      },
    ],
    payload: "A,AAAB;;ABCDE;",
  },
);

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
  const { sources, payload } = parseSourcemap(
    {
      url: "http://host/directory/map.json",
      content: generator.toString(),
    },
    "http://host/script.js",
  );
  assertDeepEqual(sources, [
    {
      url: "http://host/directory/source.js",
      content: null,
    },
  ]);
  const mapping = compileSourcemap(payload);
  assertDeepEqual(mapPosition(mapping, { line: 3, column: 5 }), {
    index: 0,
    position: { line: 7, column: 11 },
  });
  assertDeepEqual(mapPosition(mapping, { line: 3, column: 13 }), {
    index: 0,
    position: { line: 17, column: 19 },
  });
  assertDeepEqual(mapPosition(mapping, { line: 3, column: 23 }), null);
  assertDeepEqual(mapPosition(mapping, { line: 4, column: 23 }), null);
}
