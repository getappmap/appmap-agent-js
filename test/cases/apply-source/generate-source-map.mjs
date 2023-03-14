import { writeFile as writeFileAsync } from "node:fs/promises";
import SourceMap from "source-map";
const { SourceMapGenerator } = SourceMap;
const generator = new SourceMapGenerator();
const { URL } = globalThis;
generator.addMapping({
  source: "source.mjs",
  original: { line: 2, column: 0 },
  generated: { line: 1, column: 0 },
});
generator.addMapping({
  source: "source.mjs",
  original: { line: 4, column: 0 },
  generated: { line: 3, column: 0 },
});
await writeFileAsync(
  new URL("source.map", import.meta.url),
  generator.toString(),
  "utf8",
);
