import { strict as Assert } from "assert";
import { SourceMapGenerator } from "source-map";
import { buildTestDependenciesAsync } from "../../build.mjs";
import SourceInner from "./index.mjs";

const {
  // ok: assert,
  equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { compileSourceMap, mapSource } = SourceInner(dependencies);

const generator = new SourceMapGenerator({
  file: "file:///generated.js",
  sourceRoot: "",
});
generator.addMapping({
  source: "file:///original.ts",
  original: { line: 10, column: 20 },
  generated: { line: 30, column: 40 },
});
generator.setSourceContent("/original.ts", "123;");

const source_map = compileSourceMap(JSON.parse(generator.toString()));

assertDeepEqual(mapSource(source_map, 30, 40), {
  line: 10,
  column: 20,
  url: "file:///original.ts",
});

assertEqual(mapSource(source_map, 50, 60), null);
