import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../build.mjs";
import Classmap from "./index.mjs";

Error.stackTraceLimit = Infinity;

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const {
  createClassmap,
  addClassmapSource,
  compileClassmap,
  getClassmapClosure,
} = Classmap(dependencies);

const cwd = "/cwd";

const placeholder = "$";

{
  const classmap = createClassmap(
    extendConfiguration(
      createConfiguration(cwd),
      {
        pruning: true,
        "function-name-placeholder": placeholder,
        "collapse-package-hierachy": true,
      },
      cwd,
    ),
  );

  addClassmapSource(classmap, {
    url: `file://${cwd}/directory/function.js`,
    content:
      "const o = { f: \n function (x) {} , g: \n function (y) {} , h: \n function (z) {} }; const p = {};",
    inline: false,
    exclude: ["o.g"],
    shallow: true,
  });

  assertEqual(
    getClassmapClosure(classmap, `file://${cwd}/directory/function.js#1-1`),
    null,
  );

  assertDeepEqual(
    getClassmapClosure(classmap, `file://${cwd}/directory/function.js#2-1`),
    {
      parameters: ["x"],
      shallow: true,
      link: {
        defined_class: "f",
        method_id: placeholder,
        path: "directory/function.js",
        lineno: 2,
        static: false,
      },
    },
  );

  assertDeepEqual(
    getClassmapClosure(classmap, `file://${cwd}/directory/function.js#3-1`),
    null,
  );

  assertDeepEqual(
    getClassmapClosure(classmap, `file://${cwd}/directory/function.js#2-0`),
    getClassmapClosure(classmap, `file://${cwd}/directory/function.js#2-1`),
  );

  assertDeepEqual(
    compileClassmap(
      classmap,
      new Set([
        `file://${cwd}/directory/function.js#2-0`,
        `file://${cwd}/directory/function.js#2-1`,
      ]),
    ),
    [
      {
        type: "package",
        name: "directory/function.js",
        children: [
          {
            type: "class",
            name: "o",
            children: [
              {
                type: "class",
                name: "f",
                children: [
                  {
                    type: "function",
                    name: placeholder,
                    comment: null,
                    labels: [],
                    source: null,
                    static: false,
                    location: "directory/function.js:2",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  );
}

{
  const classmap = createClassmap(
    extendConfiguration(
      createConfiguration(cwd),
      {
        pruning: false,
        "function-name-placeholder": placeholder,
        "collapse-package-hierachy": false,
      },
      cwd,
    ),
  );

  addClassmapSource(classmap, {
    url: `file://${cwd}/directory/function.js`,
    content:
      "function f () {} /* comment1 */ \n function g () {} /* comment2 */ /* comment3 */ \n function h () {}",
    inline: true,
    exclude: [],
    shallow: false,
  });

  assertDeepEqual(compileClassmap(classmap, new Set([])), [
    {
      type: "package",
      name: "directory",
      children: [
        {
          type: "package",
          name: "function.js",
          children: [
            {
              type: "class",
              name: "f",
              children: [
                {
                  type: "function",
                  name: placeholder,
                  comment: null,
                  labels: [],
                  source: "function f () {}",
                  static: false,
                  location: "directory/function.js:1",
                },
              ],
            },
            {
              type: "class",
              name: "g",
              children: [
                {
                  type: "function",
                  name: placeholder,
                  comment: "/* comment1 */",
                  labels: [],
                  source: "function g () {}",
                  static: false,
                  location: "directory/function.js:2",
                },
              ],
            },
            {
              type: "class",
              name: "h",
              children: [
                {
                  type: "function",
                  name: placeholder,
                  comment: "/* comment2 */\n/* comment3 */",
                  labels: [],
                  source: "function h () {}",
                  static: false,
                  location: "directory/function.js:3",
                },
              ],
            },
          ],
        },
      ],
    },
  ]);
}
