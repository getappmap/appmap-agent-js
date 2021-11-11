import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "../__fixture__.mjs";
import { SourceMapGenerator } from "source-map";

const {
  equal: assertEqual,
  // deepEqual: assertDeepEqual
} = Assert;

await runAsync(
  null,
  {
    recorder: "process",
    command: "node ./script.js",
    packages: { glob: "*" },
    output: {
      basename: "basename",
    },
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
      `${repository}/source.js`,
      ["// Source //", "function f () {}", "f();"].join("\n"),
      "utf8",
    );
    await writeFileAsync(
      `${repository}/script.js`,
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
      `${repository}/source.map`,
      generator.toString(),
      "utf8",
    );
  },
  async (directory) => {
    const {
      events: [{ lineno }],
    } = JSON.parse(
      await readFileAsync(
        `${directory}/tmp/appmap/basename.appmap.json`,
        "utf8",
      ),
    );
    assertEqual(lineno, 2);
  },
);
