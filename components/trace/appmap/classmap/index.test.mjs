import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../build.mjs";
import Classmap from "./index.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

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

const classmap = createClassmap(
  extendConfiguration(
    createConfiguration(cwd),
    { pruning: true, "function-name-placeholder": placeholder },
    cwd,
  ),
);

addClassmapSource(classmap, {
  url: `file://${cwd}/directory/function.js`,
  content: "// comment\n function f (x) {}",
  inline: true,
  exclude: ["^"],
  shallow: true,
});

getClassmapClosure(classmap, `file://${cwd}/directory/function.js#0-0`);

assertDeepEqual(
  getClassmapClosure(classmap, `file://${cwd}/directory/function.js#2-1`),
  {
    excluded: true,
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
  getClassmapClosure(classmap, `file://${cwd}/directory/function.js#2-0`),
  getClassmapClosure(classmap, `file://${cwd}/directory/function.js#2-1`),
);

addClassmapSource(classmap, {
  url: `file://${cwd}/directory/class.js`,
  content: "class c {static m1 () {}};\nconst o = { m2 () {} };",
  inline: false,
  exclude: ["c#m1"],
  shallow: false,
});

assertDeepEqual(
  getClassmapClosure(classmap, `file://${cwd}/directory/class.js#1-19`),
  {
    excluded: true,
    parameters: [],
    shallow: false,
    link: {
      defined_class: "m1",
      method_id: placeholder,
      path: "directory/class.js",
      lineno: 1,
      static: true,
    },
  },
);

assertDeepEqual(
  compileClassmap(classmap, [`file://${cwd}/directory/function.js#2-0`]),
  [
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
                  comment: "// comment",
                  labels: [],
                  source: "function f (x) {}",
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
