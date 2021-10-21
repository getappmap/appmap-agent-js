import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Source from "./source.mjs";
import { SourceMapGenerator } from "source-map";

Error.stackTraceLimit = Infinity;

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const {
  extractSourceMapURL,
  createMirrorSourceMap,
  createSourceMap,
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
  const map = createMirrorSourceMap({ url: "file:///out.js", content: "123;" });
  assertDeepEqual(mapSource(map, 123, 456), {
    url: "file:///out.js",
    line: 123,
    column: 456,
  });
  getSources(map, [{ url: "file:///out.js", content: "123;" }]);
}

{
  const generator = new SourceMapGenerator();
  generator.addMapping({
    source: "source",
    original: { line: 10, column: 20 },
    generated: { line: 30, column: 40 },
  });
  const { mappings } = JSON.parse(generator.toString());
  const map = createSourceMap({
    url: "file:///directory/map.json",
    content: JSON.stringify({
      version: 3,
      file: "file:///source.js",
      sourceRoot: "root/",
      sources: ["source.js"],
      sourcesContent: ["456;"],
      names: [],
      mappings,
    }),
  });
  assertDeepEqual(mapSource(map, 30, 40), {
    url: "file:///directory/root/source.js",
    line: 10,
    column: 20,
  });
  assertEqual(mapSource(map, 0, 0), null);
  assertDeepEqual(getSources(map), [
    { url: "file:///directory/root/source.js", content: "456;" },
  ]);
}
