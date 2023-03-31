import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createClassmap,
  addClassmapSource,
  compileClassmap,
  lookupClassmapClosure,
} from "./index.mjs";

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
  const source1 = {
    url: "protocol://host/home/directory/dynamic.js",
    content: "function f (x) {}",
    hash: "hash1",
  };
  const source2 = {
    url: "protocol://host/home/directory/dynamic.js",
    content: "function g (y) {}",
    hash: "hash2",
  };
  const source3 = {
    url: "protocol://host/home/directory/static.js",
    content: "function h (z) {}",
    hash: "hash3",
  };
  assertEqual(addClassmapSource(classmap, source1), true);
  assertEqual(addClassmapSource(classmap, source1), true); // caching
  assertEqual(addClassmapSource(classmap, source2), true);
  assertEqual(addClassmapSource(classmap, source3), true);
  assertEqual(
    lookupClassmapClosure(classmap, {
      url: "protocol://host/home/directory/dynamic.js",
      hash: "missing-hash",
      line: 1,
      column: 0,
    }),
    null,
  );
  assertDeepEqual(
    lookupClassmapClosure(classmap, {
      url: source1.url,
      hash: source1.hash,
      line: 1,
      column: 0,
    }),
    {
      parameters: ["x"],
      shallow: true,
      link: {
        defined_class: "dynamic",
        method_id: "f",
        path: "./directory/dynamic.js#0",
        lineno: 1,
        static: false,
      },
    },
  );
  assertDeepEqual(
    lookupClassmapClosure(classmap, {
      url: source2.url,
      hash: source2.hash,
      line: 1,
      column: 0,
    }),
    {
      parameters: ["y"],
      shallow: true,
      link: {
        defined_class: "dynamic",
        method_id: "g",
        path: "./directory/dynamic.js#1",
        lineno: 1,
        static: false,
      },
    },
  );
  assertDeepEqual(
    lookupClassmapClosure(classmap, {
      url: source3.url,
      hash: null,
      line: 1,
      column: 0,
    }),
    {
      parameters: ["z"],
      shallow: true,
      link: {
        defined_class: "static",
        method_id: "h",
        path: "./directory/static.js",
        lineno: 1,
        static: false,
      },
    },
  );
  assertDeepEqual(
    lookupClassmapClosure(classmap, {
      url: source1.url,
      hash: null,
      line: 1,
      column: 0,
    }),
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
  const source1 = {
    url: "protocol://host/base/directory/empty.js",
    content: null,
    hash: null,
  };
  const source2 = {
    url: "external://relative/url/file.js",
    content: "",
    hash: "hash2",
  };
  const source3 = {
    url: "protocol://host/base/directory/disabled.js",
    content: "",
    hash: "hash3",
  };
  assertEqual(addClassmapSource(classmap, source1), false);
  assertEqual(addClassmapSource(classmap, source2), false);
  assertEqual(addClassmapSource(classmap, source3), false);
  assertEqual(
    lookupClassmapClosure(classmap, {
      url: source1.url,
      hash: null,
      line: 123,
      column: 456,
    }),
    null,
  );
  assertEqual(
    lookupClassmapClosure(classmap, {
      url: source2.url,
      hash: null,
      line: 123,
      column: 456,
    }),
    null,
  );
  assertEqual(
    lookupClassmapClosure(classmap, {
      url: source3.url,
      hash: null,
      line: 123,
      column: 456,
    }),
    null,
  );
  assertEqual(
    lookupClassmapClosure(classmap, {
      url: "protocol://host/base/directory/missing.js",
      hash: null,
      line: 123,
      column: 456,
    }),
    null,
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

  const source = {
    url: "protocol://host/home/directory/file.js",
    content: "function f (x) {}",
    hash: "hash",
  };

  assertEqual(addClassmapSource(classmap, source), true);

  lookupClassmapClosure(classmap, {
    url: source.url,
    hash: null,
    line: 1,
    column: 0,
  });

  assertDeepEqual(compileClassmap(classmap), [
    {
      type: "package",
      name: "./directory/file.js",
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
              location: "./directory/file.js:1",
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
    addClassmapSource(classmap, {
      url: "protocol://host/home/file.js",
      content: "function f (x) {}",
      hash: "hash1",
    }),
    true,
  );

  assertEqual(
    addClassmapSource(classmap, {
      url: "protocol://host/home/file.js",
      content: "function g (x) {}",
      hash: "hash2",
    }),
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
              location: "./file.js#0:1",
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
              location: "./file.js#1:1",
            },
          ],
        },
      ],
    },
  ]);
}
