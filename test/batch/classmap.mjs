import { writeFile } from "fs/promises";
import { strict as Assert } from "assert";
import { setupAsync } from "./setup.mjs";

const { deepEqual: assertDeepEqual } = Assert;

export default async (protocol) => {
  await setupAsync(
    "app",
    "1.2.3",
    {
      enabled: true,
      name: "name",
      protocol,
      "function-name-placeholder": "$",
      children: [["node", "./main.mjs"]],
      packages: [{ glob: "*" }],
      hooks: {
        esm: true,
        cjs: true,
      },
      output: { filename: "filename" },
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
      await writeFile(
        `${repository}/common.js`,
        `function common () {}`,
        "utf8",
      );
      await writeFile(
        `${repository}/native.mjs`,
        `function native () {}`,
        "utf8",
      );
    },
    async (appmaps) => {
      const { "filename.appmap.json": appmap } = appmaps;
      const { classMap: classmap } = appmap;
      assertDeepEqual(classmap, [
        {
          type: "package",
          name: "main.mjs",
          children: [
            {
              type: "class",
              name: "$",
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
          ],
        },
        {
          type: "package",
          name: "common.js",
          children: [
            {
              type: "class",
              name: "$",
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
          ],
        },
        {
          type: "package",
          name: "native.mjs",
          children: [
            {
              type: "class",
              name: "$",
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
            },
          ],
        },
      ]);
    },
  );
};
