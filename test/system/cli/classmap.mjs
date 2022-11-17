import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "./__fixture__.mjs";

const { JSON } = globalThis;

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    recorder: "process",
    command: "node main.mjs",
    pruning: false,
    packages: { glob: "*" },
    hooks: {
      esm: true,
      cjs: true,
      apply: false,
      http: false,
    },
    appmap_file: "basename",
  },
  async (repository) => {
    await writeFileAsync(
      `${repository}/main.mjs`,
      `
        import("./common.js");
        import("./native.mjs");
        function main () {}
      `,
      "utf8",
    );
    await writeFileAsync(
      joinPath(repository, "common.js"),
      `function common () {}`,
      "utf8",
    );
    await writeFileAsync(
      joinPath(repository, "native.mjs"),
      `function native () {}`,
      "utf8",
    );
  },
  async (directory) => {
    const appmap = JSON.parse(
      await readFileAsync(
        joinPath(directory, "tmp", "appmap", "process", "basename.appmap.json"),
        "utf8",
      ),
    );
    const { classMap: classmap } = appmap;
    assertDeepEqual(classmap, [
      {
        type: "package",
        name: ".",
        children: [
          {
            type: "class",
            name: "main",
            children: [
              {
                type: "function",
                name: "main",
                location: "main.mjs:4",
                static: false,
                source: null,
                comment: null,
                labels: [],
              },
            ],
          },
          {
            type: "class",
            name: "common",
            children: [
              {
                type: "function",
                name: "common",
                location: "common.js:1",
                static: false,
                source: null,
                comment: null,
                labels: [],
              },
            ],
          },
          {
            type: "class",
            name: "native",
            children: [
              {
                type: "function",
                name: "native",
                location: "native.mjs:1",
                static: false,
                source: null,
                comment: null,
                labels: [],
              },
            ],
          }
        ],
      },
    ]);
  },
);
