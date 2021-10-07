import { writeFile } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "./__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    "function-name-placeholder": "placeholder",
    packages: { glob: "*" },
    hooks: {
      esm: true,
      cjs: true,
      apply: false,
      http: false,
    },
    name: "name",
    scenario: "scenario",
    scenarios: {
      scenario: ["node", "./main.mjs"],
    },
  },
  async (repository) => {
    await writeFile(
      `${repository}/main.mjs`,
      `
        import("./common.js");
        import("./native.mjs");
        function main () {}
      `,
      "utf8",
    );
    await writeFile(`${repository}/common.js`, `function common () {}`, "utf8");
    await writeFile(
      `${repository}/native.mjs`,
      `function native () {}`,
      "utf8",
    );
  },
  async (appmaps) => {
    const { "name.appmap.json": appmap } = appmaps;
    const { classMap: classmap } = appmap;
    assertDeepEqual(classmap, [
      {
        type: "package",
        name: "main.mjs",
        children: [
          {
            type: "class",
            name: "main",
            children: [
              {
                type: "function",
                name: "placeholder",
                location: "main.mjs:4",
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
        name: "common.js",
        children: [
          {
            type: "class",
            name: "common",
            children: [
              {
                type: "function",
                name: "placeholder",
                location: "common.js:1",
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
        name: "native.mjs",
        children: [
          {
            type: "class",
            name: "native",
            children: [
              {
                type: "function",
                name: "placeholder",
                location: "native.mjs:1",
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
