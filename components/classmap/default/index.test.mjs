import {
  assertThrow,
  assertDeepEqual,
  assertEqual,
} from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { createSource, makeSourceLocation } from "../../source/index.mjs";
import {
  createClassmap,
  addClassmapSource,
  compileClassmap,
  lookupClassmapClosure,
} from "./index.mjs";

const toStaticLocation = (location) => ({
  ...location,
  hash: null,
});

// lookupClassmapClosure >> present source //
{
  const classmap = createClassmap(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        packages: [
          {
            glob: "directory/*.js",
            "inline-source": true,
            exclude: [],
            shallow: true,
          },
        ],
        "default-package": {
          "inline-source": false,
          exclude: [],
          shallow: false,
        },
        "inline-source": false,
      },
      "protocol://host/home/",
    ),
  );
  const source1 = createSource(
    "protocol://host/home/directory/dynamic.js",
    "function f (x) {}",
  );
  const source2 = createSource(
    "protocol://host/home/directory/dynamic.js",
    "function g (y) {}",
  );
  const source3 = createSource(
    "protocol://host/home/directory/static.js",
    "function h (z) {}",
  );
  assertEqual(addClassmapSource(classmap, source1), true);
  assertEqual(addClassmapSource(classmap, source1), true); // caching
  assertEqual(addClassmapSource(classmap, source2), true);
  assertEqual(addClassmapSource(classmap, source3), true);
  assertDeepEqual(
    lookupClassmapClosure(classmap, makeSourceLocation(source1, 1, 0)),
    {
      parameters: ["x"],
      shallow: true,
      link: {
        defined_class: "dynamic",
        method_id: "f",
        path: "directory/dynamic.js#0",
        lineno: 1,
        static: false,
      },
    },
  );
  assertDeepEqual(
    lookupClassmapClosure(classmap, makeSourceLocation(source2, 1, 0)),
    {
      parameters: ["y"],
      shallow: true,
      link: {
        defined_class: "dynamic",
        method_id: "g",
        path: "directory/dynamic.js#1",
        lineno: 1,
        static: false,
      },
    },
  );
  assertDeepEqual(
    lookupClassmapClosure(
      classmap,
      toStaticLocation(makeSourceLocation(source3, 1, 0)),
    ),
    {
      parameters: ["z"],
      shallow: true,
      link: {
        defined_class: "static",
        method_id: "h",
        path: "directory/static.js",
        lineno: 1,
        static: false,
      },
    },
  );
  assertDeepEqual(
    lookupClassmapClosure(
      classmap,
      toStaticLocation(makeSourceLocation(source1, 1, 0)),
    ),
    null,
  );
}

// lookupClassmapClosure >> missing source //
{
  const classmap = createClassmap(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        packages: [
          {
            regexp: "disabled\\.js$",
            enabled: false,
          },
          {
            regexp: "^",
            enabled: true,
          },
        ],
      },
      "protocol://host/base/",
    ),
  );
  const source1 = createSource("protocol://host/base/directory/empty.js", null);
  const source2 = createSource("external://relative/url/file.js", "");
  const source3 = createSource(
    "protocol://host/base/directory/disabled.js",
    "",
  );
  assertEqual(addClassmapSource(classmap, source1), false);
  assertEqual(addClassmapSource(classmap, source2), false);
  assertEqual(addClassmapSource(classmap, source3), false);
  assertEqual(
    lookupClassmapClosure(classmap, makeSourceLocation(source1, 123, 456)),
    null,
  );
  assertEqual(
    lookupClassmapClosure(classmap, makeSourceLocation(source2, 123, 456)),
    null,
  );
  assertEqual(
    lookupClassmapClosure(classmap, makeSourceLocation(source3, 123, 456)),
    null,
  );
  assertEqual(
    lookupClassmapClosure(
      classmap,
      makeSourceLocation(
        createSource("protocol://host/base/directory/missing.js", null),
        123,
        456,
      ),
    ),
    null,
  );
  assertEqual(
    lookupClassmapClosure(
      classmap,
      makeSourceLocation(
        createSource("protocol://host/base/directory/missing.js", "789;"),
        123,
        456,
      ),
    ),
    null,
  );
  assertThrow(
    () =>
      lookupClassmapClosure(classmap, {
        url: null,
        hash: null,
        line: 123,
        column: 456,
      }),
    /^InternalAppmapError/u,
  );
}

// pruning && collapse //
{
  const classmap = createClassmap(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        pruning: true,
        "collapse-package-hierachy": true,
        packages: [
          {
            glob: "directory/*.js",
            "inline-source": true,
            exclude: [],
            shallow: true,
          },
        ],
        "default-package": {
          "inline-source": false,
          exclude: [],
          shallow: false,
        },
        "inline-source": false,
      },
      "protocol://host/home/",
    ),
  );

  const source = createSource(
    "protocol://host/home/directory/file.js",
    "function f (x) {}",
  );

  assertEqual(addClassmapSource(classmap, source), true);

  lookupClassmapClosure(classmap, makeSourceLocation(source, 1, 0));

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
        "default-package": {
          "inline-source": null,
          exclude: [],
          shallow: false,
          enabled: true,
        },
        "inline-source": false,
      },
      "protocol://host/base/",
    ),
  );

  assertEqual(
    addClassmapSource(
      classmap,
      createSource("protocol://host/home/file.js", "function f (x) {}"),
    ),
    true,
  );

  assertEqual(
    addClassmapSource(
      classmap,
      createSource("protocol://host/home/file.js", "function g (x) {}"),
    ),
    true,
  );

  assertDeepEqual(compileClassmap(classmap), [
    {
      type: "package",
      name: ".",
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
              source: null,
              static: false,
              location: "file.js#0:1",
            },
          ],
        },
        {
          type: "class",
          name: "file",
          children: [
            {
              type: "function",
              name: "g",
              comment: null,
              labels: [],
              source: null,
              static: false,
              location: "file.js#1:1",
            },
          ],
        },
      ],
    },
  ]);
}
