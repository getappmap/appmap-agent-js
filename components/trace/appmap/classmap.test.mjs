import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Classmap from "./classmap.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const { createClassmap, addClassmapFile, compileClassmap, getClassmapClosure } =
  Classmap(dependencies);

const default_conf = {
  pruning: false,
  language: { name: "ecmascript", version: "2020" },
  "function-name-placeholder": "$",
};

const setup = (cwd, conf, files) => {
  const classmap = createClassmap(
    extendConfiguration(createConfiguration(cwd), conf, cwd),
  );
  for (const file of files) {
    addClassmapFile(classmap, file);
  }
  return classmap;
};

const test = (cwd, conf, files, slice = new Set()) =>
  compileClassmap(setup(cwd, conf, files), slice);

// populate //

assertDeepEqual(
  test("/cwd", default_conf, [
    {
      index: 0,
      exclude: [],
      shallow: false,
      source: false,
      type: "script",
      path: "/cwd/foo/bar",
      code: "123;",
    },
    {
      index: 1,
      exclude: [],
      shallow: false,
      source: false,
      type: "script",
      path: "/cwd/foo/bar/qux",
      code: "123;",
    },
  ]),
  [
    {
      type: "package",
      name: "foo",
      children: [
        {
          type: "package",
          name: "bar",
          children: [],
        },
        {
          type: "package",
          name: "bar",
          children: [
            {
              type: "package",
              name: "qux",
              children: [],
            },
          ],
        },
      ],
    },
  ],
);

// basic //
assertDeepEqual(
  test("/cwd", { ...default_conf }, [
    {
      index: 123,
      exclude: [],
      shallow: true,
      source: true,
      type: "script",
      path: "/cwd/filename.js",
      code: "// comment \nfunction f () {}",
    },
  ]),
  [
    {
      type: "package",
      name: "filename.js",
      children: [
        {
          type: "class",
          name: "f",
          children: [
            {
              type: "function",
              name: "$",
              location: "filename.js:2",
              static: false,
              labels: [],
              comment: " comment ",
              source: "function f () {}",
            },
          ],
        },
      ],
    },
  ],
);

// class //

{
  const testClass = (snippet) => {
    assertDeepEqual(
      test("/cwd", default_conf, [
        {
          index: 123,
          exclude: [],
          shallow: false,
          source: false,
          type: "script",
          path: "/cwd/filename.js",
          code: `x = ${snippet};`,
        },
      ]),
      [
        {
          type: "package",
          name: "filename.js",
          children: [
            {
              type: "class",
              name: "x",
              children: [
                {
                  type: "class",
                  name: "k",
                  children: [
                    {
                      type: "function",
                      name: "$",
                      location: "filename.js:1",
                      static: false,
                      labels: [],
                      comment: null,
                      source: null,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    );
  };
  testClass("{k: function () {} }");
  testClass("class { k () {} }");
  testClass("class extends Object { k () {} }");
}

// exclude //

assertDeepEqual(
  test("/cwd", default_conf, [
    {
      index: 0,
      exclude: ["f"],
      shallow: false,
      source: false,
      type: "script",
      path: "/cwd/filename.js",
      code: "function f () {}",
    },
  ]),
  [
    {
      type: "package",
      name: "filename.js",
      children: [],
    },
  ],
);

// pruning //

assertDeepEqual(
  test(
    "/cwd",
    { ...default_conf, pruning: true },
    [
      {
        index: 123,
        exclude: [],
        shallow: false,
        source: false,
        type: "script",
        path: "/cwd/filename.js",
        code: "o1 = {k1 () {}}; o2 = {k2 () {} }",
      },
    ],
    new Set(["123/body/0/expression/right/properties/0/value"]),
  ),
  [
    {
      type: "package",
      name: "filename.js",
      children: [
        {
          type: "class",
          name: "o1",
          children: [
            {
              type: "class",
              name: "k1",
              children: [
                {
                  type: "function",
                  name: "$",
                  location: "filename.js:1",
                  static: false,
                  labels: [],
                  comment: null,
                  source: null,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
);

// getClassmapClosure //

assertDeepEqual(
  getClassmapClosure(
    setup("/cwd", default_conf, [
      {
        index: 123,
        exclude: [],
        shallow: false,
        source: false,
        type: "script",
        path: "/cwd/filename.js",
        code: "function f (x, ... xs) {}",
      },
    ]),
    "123/body/0",
  ),
  {
    shallow: false,
    link: {
      defined_class: "f",
      method_id: "$",
      path: "filename.js",
      lineno: 1,
      static: false,
    },
    parameters: ["x", "...xs"],
  },
);
