import { assertDeepEqual, assertEqual } from "../../../__fixture__.mjs";
import { makeLocation } from "../../../location/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../../configuration/index.mjs";
import {
  createClassmap,
  addClassmapSource,
  compileClassmap,
  lookupClassmapClosure,
} from "./index.mjs";

const default_exclusion = {
  combinator: "and",
  "qualified-name": true,
  name: true,
  "every-label": true,
  "some-label": true,
  excluded: false,
  recursive: false,
};

// pruning && collapse //
{
  const classmap = createClassmap(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        pruning: true,
        "collapse-package-hierachy": true,
      },
      "protocol://host/dummy/",
    ),
  );

  addClassmapSource(classmap, {
    url: "protocol://host/home/directory/file.js",
    content: "function f (x) {}\nfunction g (y) {}",
    inline: true,
    shallow: true,
    exclude: [default_exclusion],
  });

  assertEqual(
    lookupClassmapClosure(
      classmap,
      makeLocation("protocol://host/home/directory/missing.js", {
        line: 0,
        column: 0,
      }),
    ),
    null,
  );

  assertDeepEqual(
    lookupClassmapClosure(
      classmap,
      makeLocation("protocol://host/home/directory/file.js", {
        line: 1,
        column: 0,
      }),
    ),
    {
      parameters: ["x"],
      shallow: true,
      link: {
        defined_class: "file",
        method_id: "f",
        path: "directory/file.js",
        lineno: 1,
        static: false,
      },
    },
  );

  assertDeepEqual(compileClassmap(classmap), [
    {
      type: "package",
      name: "directory/file.js",
      children: [
        {
          type: "class",
          name: "file",
          children: [
            {
              type: "function",
              name: "f",
              comment: null,
              labels: [],
              source: "function f (x) {}",
              static: false,
              location: "directory/file.js:1",
            },
          ],
        },
      ],
    },
  ]);
}

// no-pruning && no-collapse && top-level file //
{
  const classmap = createClassmap(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        pruning: false,
        "collapse-package-hierachy": false,
      },
      "protocol://host/base/",
    ),
  );

  addClassmapSource(classmap, {
    url: "protocol://host/home/file1.js",
    content: "function f (x) {}",
    inline: false,
    exclude: [default_exclusion],
    shallow: false,
  });

  addClassmapSource(classmap, {
    url: "protocol://host/home/file2.js",
    content: "function g (x) {}",
    inline: false,
    exclude: [default_exclusion],
    shallow: false,
  });

  assertDeepEqual(compileClassmap(classmap), [
    {
      type: "package",
      name: ".",
      children: [
        {
          type: "class",
          name: "file1",
          children: [
            {
              type: "function",
              name: "f",
              comment: null,
              labels: [],
              source: null,
              static: false,
              location: "file1.js:1",
            },
          ],
        },
        {
          type: "class",
          name: "file2",
          children: [
            {
              type: "function",
              name: "g",
              comment: null,
              labels: [],
              source: null,
              static: false,
              location: "file2.js:1",
            },
          ],
        },
      ],
    },
  ]);
}
