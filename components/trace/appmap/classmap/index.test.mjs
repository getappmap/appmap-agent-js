import { assertDeepEqual, assertEqual } from "../../../__fixture__.mjs";
import { sep } from "path";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../build.mjs";
import Classmap from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { stringifyLocation, makeLocation } = await buildTestComponentAsync(
  "location",
);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");
const {
  createClassmap,
  addClassmapSource,
  compileClassmap,
  getClassmapClosure,
} = Classmap(dependencies);

const placeholder = "$";

const and_exclude = {
  combinator: "and",
  "qualified-name": true,
  name: true,
  "every-label": true,
  "some-label": true,
  excluded: false,
  recursive: false,
};

// const or_exclude = {
//   combinator: "or",
//   "qualified-name": false,
//   name: false,
//   "every-label": false,
//   "some-label": false,
//   excluded: false,
//   recursive: false,
// };

{
  const classmap = createClassmap(
    extendConfiguration(
      createConfiguration("file:///home"),
      {
        pruning: true,
        "function-name-placeholder": placeholder,
        "collapse-package-hierachy": true,
      },
      "file:///base",
    ),
  );

  addClassmapSource(classmap, {
    url: `file:///home/directory/function.js`,
    content:
      "const o = { f: \n function (x) {} , g: \n function (y) {} , h: \n function (z) {} , i : \n function (t) { function j () {} } }; const p = {};",
    inline: false,
    exclude: [
      {
        ...and_exclude,
        "qualified-name": "^o\\.g$",
        excluded: true,
        recursive: false,
      },
      {
        ...and_exclude,
        "qualified-name": "^o\\.i$",
        excluded: true,
        recursive: true,
      },
      and_exclude,
    ],
    shallow: true,
  });

  assertEqual(
    getClassmapClosure(
      classmap,
      stringifyLocation(
        makeLocation(`file:///home/directory/function.js`, 1, 1),
      ),
    ),
    null,
  );

  assertDeepEqual(
    getClassmapClosure(
      classmap,
      stringifyLocation(
        makeLocation(`file:///home/directory/function.js`, 2, 1),
      ),
    ),
    {
      parameters: ["x"],
      shallow: true,
      link: {
        defined_class: "f",
        method_id: placeholder,
        path: ["directory", "function.js"].join(sep),
        lineno: 2,
        static: false,
      },
    },
  );

  assertDeepEqual(
    getClassmapClosure(
      classmap,
      stringifyLocation(
        makeLocation(`file:///home/directory/function.js`, 3, 1),
      ),
    ),
    null,
  );

  assertDeepEqual(
    getClassmapClosure(
      classmap,
      stringifyLocation(
        makeLocation(`file:///home/directory/function.js`, 2, 0),
      ),
    ),
    getClassmapClosure(
      classmap,
      stringifyLocation(
        makeLocation(`file:///home/directory/function.js`, 2, 1),
      ),
    ),
  );

  assertDeepEqual(
    compileClassmap(
      classmap,
      new Set([
        stringifyLocation(
          makeLocation(`file:///home/directory/function.js`, 2, 0),
        ),
        stringifyLocation(
          makeLocation(`file:///home/directory/function.js`, 2, 1),
        ),
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
      createConfiguration("file:///home"),
      {
        pruning: false,
        "function-name-placeholder": placeholder,
        "collapse-package-hierachy": false,
      },
      "file:///base",
    ),
  );

  addClassmapSource(classmap, {
    url: `file:///home/directory/function.js`,
    content:
      "function f () {} /* comment1 */ \n function g () {} /* comment2 */ /* comment3 */ \n function h () {}",
    inline: true,
    exclude: [and_exclude],
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
