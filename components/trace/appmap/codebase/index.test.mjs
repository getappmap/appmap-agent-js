import { assertDeepEqual, assertEqual } from "../../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../../configuration/index.mjs";
import {
  createCodebase,
  lookupClosureLocation,
  exportClassmap,
} from "./index.mjs";

// lookupClosureLocation >> present source //
{
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
  const codebase = createCodebase(
    [source1, source1, source2, source3],
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
  assertEqual(
    lookupClosureLocation(codebase, {
      url: "protocol://host/home/directory/dynamic.js",
      hash: "missing-hash",
      position: { line: 1, column: 0 },
    }),
    null,
  );
  assertDeepEqual(
    lookupClosureLocation(codebase, {
      url: source1.url,
      hash: source1.hash,
      position: { line: 1, column: 0 },
    }),
    {
      specifier: "./directory/dynamic.js#1",
      position: { line: 1, column: 0 },
      parent: "dynamic",
      static: false,
      name: "f",
      parameters: ["x"],
      shallow: true,
    },
  );
  assertDeepEqual(
    lookupClosureLocation(codebase, {
      url: source2.url,
      hash: source2.hash,
      position: { line: 1, column: 0 },
    }),
    {
      specifier: "./directory/dynamic.js#1",
      position: { line: 1, column: 0 },
      parent: "dynamic",
      static: false,
      name: "g",
      parameters: ["y"],
      shallow: true,
    },
  );
  assertDeepEqual(
    lookupClosureLocation(codebase, {
      url: source3.url,
      hash: null,
      position: { line: 1, column: 0 },
    }),
    {
      specifier: "./directory/static.js",
      position: { line: 1, column: 0 },
      parent: "static",
      static: false,
      name: "h",
      parameters: ["z"],
      shallow: true,
    },
  );
  assertDeepEqual(
    lookupClosureLocation(codebase, {
      url: source1.url,
      hash: null,
      position: { line: 1, column: 0 },
    }),
    null,
  );
}

// lookupClosureLocation >> missing source //
{
  const source1 = {
    url: "external://relative/url/empty.js",
    content: "",
    hash: "hash1",
  };
  const source2 = {
    url: "protocol://host/base/directory/disabled.js",
    content: "function f () {}",
    hash: "hash2",
  };
  const source3 = {
    url: "protocol://host/base/directory/excluded.js",
    content: "function g () {}",
    hash: "hash3",
  };
  const codebase = createCodebase(
    [source1, source1, source2, source3],
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        exclude: [{ name: "^g$" }],
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
  assertEqual(
    lookupClosureLocation(codebase, {
      url: source1.url,
      hash: null,
      position: { line: 1, column: 0 },
    }),
    null,
  );
  assertEqual(
    lookupClosureLocation(codebase, {
      url: source2.url,
      hash: null,
      position: { line: 1, column: 0 },
    }),
    null,
  );
  assertEqual(
    lookupClosureLocation(codebase, {
      url: source3.url,
      hash: null,
      position: { line: 1, column: 0 },
    }),
    null,
  );
  assertEqual(
    lookupClosureLocation(codebase, {
      url: "protocol://host/base/directory/missing.js",
      hash: null,
      position: { line: 123, column: 456 },
    }),
    null,
  );
}

// pruning //
{
  const codebase = createCodebase(
    [
      {
        url: "protocol://host/home/directory/file.js",
        content: "function f (x) {}",
        hash: "hash",
      },
    ],
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
  assertDeepEqual(exportClassmap(codebase), []);
}

// collapse //
{
  const codebase = createCodebase(
    [
      {
        url: "protocol://host/home/directory/file.js",
        content: "function f (x) {}",
        hash: "hash",
      },
    ],
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        pruning: false,
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
  assertDeepEqual(exportClassmap(codebase), [
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
  const codebase = createCodebase(
    [
      {
        url: "protocol://host/home/file.js",
        content: "function f (x) {}",
        hash: "hash1",
      },
      {
        url: "protocol://host/home/file.js",
        content: "function g (x) {}",
        hash: "hash2",
      },
    ],
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
  assertDeepEqual(exportClassmap(codebase), [
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
