import { writeFile } from "fs/promises";
import { strict as Assert } from "assert";
import { setupAsync } from "./setup.mjs";

const { deepEqual: assertDeepEqual } = Assert;

export default async (mode, protocol) => {
  await setupAsync(
    "app",
    "1.2.3",
    {
      enabled: true,
      name: "name",
      mode,
      protocol,
      "function-name-placeholder": "$",
      packages: [{ glob: "*" }],
      hooks: {
        esm: true,
        cjs: true,
      },
      output: { filename: "filename" },
      validate: {
        message: true,
        appmap: true,
      },
    },
    ["node", "./main.mjs"],
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
              name: "main",
              children: [
                {
                  type: "function",
                  name: "$",
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
                  name: "$",
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
                  name: "$",
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
