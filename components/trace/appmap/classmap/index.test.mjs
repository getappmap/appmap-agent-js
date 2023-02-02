import {
  assertThrow,
  assertDeepEqual,
  assertEqual,
} from "../../../__fixture__.mjs";
import { hashFile } from "../../../hash/index.mjs";
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
  const file1 = {
    url: "protocol://host/home/directory/dynamic.js",
    content: "function f (x) {}",
  };
  const file2 = {
    url: "protocol://host/home/directory/dynamic.js",
    content: "function g (y) {}",
  };
  const file3 = {
    url: "protocol://host/home/directory/static.js",
    content: "function h (z) {}",
  };
  addClassmapSource(classmap, file1);
  addClassmapSource(classmap, file2);
  addClassmapSource(classmap, file3);
  assertDeepEqual(
    lookupClassmapClosure(classmap, {
      url: null,
      hash: hashFile(file1),
      line: 1,
      column: 0,
    }),
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
    lookupClassmapClosure(classmap, {
      url: null,
      hash: hashFile(file2),
      line: 1,
      column: 0,
    }),
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
    lookupClassmapClosure(classmap, {
      url: file3.url,
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
        path: "directory/static.js",
        lineno: 1,
        static: false,
      },
    },
  );
  assertDeepEqual(
    lookupClassmapClosure(classmap, {
      url: file1.url,
      hash: null,
      line: 1,
      column: 0,
    }),
    null,
  );
}

// lookupClassmapClosure >> missing source //
{
  const classmap = createClassmap(createConfiguration("protocol://host/home/"));
  const file1 = {
    url: "protocol://host/home/directory/empty.js",
    content: null,
  };
  const file2 = {
    url: "external://relative/url/file.js",
    content: "",
  };
  addClassmapSource(classmap, file1);
  addClassmapSource(classmap, file2);
  assertEqual(
    lookupClassmapClosure(classmap, {
      url: file1.url,
      hash: null,
      line: 123,
      column: 456,
    }),
    null,
  );
  assertEqual(
    lookupClassmapClosure(classmap, {
      url: file2.url,
      hash: null,
      line: 123,
      column: 456,
    }),
    null,
  );
  assertEqual(
    lookupClassmapClosure(classmap, {
      url: "protocol://host/home/directory/missing.js",
      hash: null,
      line: 123,
      column: 456,
    }),
    null,
  );
  assertEqual(
    lookupClassmapClosure(classmap, {
      url: null,
      hash: hashFile({
        url: "protocol://host/home/directory/missing.js",
        content: "789;",
      }),
      line: 123,
      column: 456,
    }),
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

  const file = {
    url: "protocol://host/home/directory/file.js",
    content: "function f (x) {}",
  };

  addClassmapSource(classmap, file);

  lookupClassmapClosure(classmap, {
    url: null,
    hash: hashFile(file),
    line: 1,
    column: 0,
  });

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
        "inline-source": false,
      },
      "protocol://host/base/",
    ),
  );

  addClassmapSource(classmap, {
    url: "protocol://host/home/file.js",
    content: "function f (x) {}",
  });

  addClassmapSource(classmap, {
    url: "protocol://host/home/file.js",
    content: "function g (x) {}",
  });

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
