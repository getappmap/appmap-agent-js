import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "./__fixture__.mjs";

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
      "eval('function f () {}');",
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
        name: "main.mjs",
        children: [],
      },
      {
        type: "package",
        name: "main.mjs",
        children: [
          {
            type: "package",
            name: "eval-1",
            children: [
              {
                type: "class",
                name: "f",
                children: [
                  {
                    type: "function",
                    name: "()",
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
        ],
      },
    ]);
  },
);
