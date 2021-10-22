import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Source from "./index.mjs";
import { SourceMapGenerator } from "source-map";

Error.stackTraceLimit = Infinity;

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const {
  extractSourceMapURL,
  createMirrorSourceMap,
  createSourceMap,
  setSourceContent,
  mapSource,
  getSources,
} = Source(await buildTestDependenciesAsync(import.meta.url));

assertEqual(
  extractSourceMapURL({
    url: "file:///directory/filename1",
    content: "//# sourceMappingURL=filename2",
  }),
  "file:///directory/filename2",
);

assertEqual(
  extractSourceMapURL({
    url: "http://localhost",
    content: "//# sourceMappingURL=file:///filename",
  }),
  "file:///filename",
);

assertEqual(
  extractSourceMapURL({
    url: "file:///directory/filename1",
    content: "123;",
  }),
  null,
);

{
  const mapping = createMirrorSourceMap({
    url: "file:///out.js",
    content: "123;",
  });
  assertDeepEqual(mapSource(mapping, 123, 456), {
    url: "file:///out.js",
    line: 123,
    column: 456,
  });
  assertDeepEqual(getSources(mapping), [
    { url: "file:///out.js", content: "123;" },
  ]);
}

{
  const generator = new SourceMapGenerator();
  generator.addMapping({
    source: "source",
    original: { line: 10, column: 20 },
    generated: { line: 30, column: 40 },
  });
  const { mappings } = JSON.parse(generator.toString());
  const mapping = createSourceMap({
    url: "file:///directory/map.json",
    content: JSON.stringify({
      version: 3,
      file: "file:///source.js",
      sourceRoot: "root/",
      sources: ["source.js"],
      sourcesContent: [null],
      names: [],
      mappings,
    }),
  });
  setSourceContent(mapping, {
    url: "file:///directory/root/source.js",
    content: "456;",
  });
  assertDeepEqual(mapSource(mapping, 30, 40), {
    url: "file:///directory/root/source.js",
    line: 10,
    column: 20,
  });
  assertEqual(mapSource(mapping, 0, 0), null);
  assertDeepEqual(getSources(mapping), [
    { url: "file:///directory/root/source.js", content: "456;" },
  ]);
}

assertDeepEqual(
  getSources(
    createSourceMap({
      url: "file:///directory/map.json",
      content: JSON.stringify({
        version: 3,
        sources: ["source.js"],
        names: [],
        mappings: "",
      }),
    }),
  ),
  [{ url: "file:///directory/source.js", content: null }],
);
