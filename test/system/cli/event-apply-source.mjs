import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "./__fixture__.mjs";
import SourceMap from "source-map";

const { JSON } = globalThis;

const { SourceMapGenerator } = SourceMap;

const {
  equal: assertEqual,
  // deepEqual: assertDeepEqual
} = Assert;

await runAsync(
  null,
  {
    recorder: "process",
    command: "node script.js",
    packages: { glob: "*" },
    appmap_file: "basename",
    hooks: {
      esm: true,
      cjs: true,
      apply: true,
      http: false,
    },
    ordering: "causal",
  },
  async (repository) => {
    await writeFileAsync(
      joinPath(repository, "source.js"),
      ["// Source //", "function f () {}", "f();"].join("\n"),
      "utf8",
    );
    await writeFileAsync(
      joinPath(repository, "script.js"),
      ["function f () {}", "f();", "//# sourceMappingURL=source.map"].join(
        "\n",
      ),
      "utf8",
    );
    const generator = new SourceMapGenerator();
    generator.addMapping({
      source: "source.js",
      original: { line: 2, column: 0 },
      generated: { line: 1, column: 0 },
    });
    await writeFileAsync(
      joinPath(repository, "source.map"),
      generator.toString(),
      "utf8",
    );
  },
  async (directory) => {
    const {
      events: [{ lineno }],
    } = JSON.parse(
      await readFileAsync(
        joinPath(directory, "tmp", "appmap", "process", "basename.appmap.json"),
        "utf8",
      ),
    );
    assertEqual(lineno, 2);
  },
);