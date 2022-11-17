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
    packages: { regexp: "^" },
    hooks: {
      eval: true,
      esm: true,
      cjs: false,
      apply: false,
    },
    appmap_file: "basename",
  },
  async (repository) => {
    await writeFileAsync(
      `${repository}/main.mjs`,
      "function f () {}\neval('function g () {}');",
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
                name: "f",
                location: "main.mjs:1",
                static: false,
                source: null,
                comment: null,
                labels: [],
              },
            ],
          },
        ],
      },
      {
        type: "package",
        name: "main.mjs",
        children: [
          {
            type: "class",
            name: "eval-1",
            children: [
              {
                type: "function",
                name: "g",
                location: "main.mjs/eval-1:1",
                static: false,
                source: null,
                comment: null,
                labels: [],
              },
            ],
          },
        ],
      },
    ]);
  },
);
