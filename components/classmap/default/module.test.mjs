import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createModule,
  resetModuleUrl,
  getModuleUrl,
  lookupModuleClosure,
  toModuleClassmap,
} from "./module.mjs";

// empty module //
assertEqual(
  lookupModuleClosure(
    createModule({
      base: "protocol://host/base/",
      url: "protocol://host/base/script.js",
      content: `123;`,
      pruning: true,
      inline: true,
      shallow: true,
      exclusions: [],
    }),
    { line: 123, column: 456 },
  ),
  null,
);

// resetModuleUrl //
assertEqual(
  getModuleUrl(
    resetModuleUrl(
      createModule({
        base: "protocol://host/base/",
        url: "protocol://host/base/script1.js",
        content: `123;`,
        pruning: true,
        inline: true,
        shallow: true,
        exclusions: [],
      }),
      "protocol://host/base/script2.js",
    ),
  ),
  "protocol://host/base/script2.js",
);

{
  const module = createModule({
    base: "protocol://host/base/",
    url: "protocol://host/base/script.js",
    content: `
      function f (x) {}
      function g (y) {}
      var o = {};
    `,
    pruning: true,
    inline: true,
    shallow: true,
    exclusions: [
      {
        combinator: "or",
        name: false,
        "qualified-name": "^script\\.g$",
        "some-label": false,
        "every-label": false,
        excluded: true,
        recursive: false,
      },
      {
        combinator: "and",
        name: true,
        "qualified-name": true,
        "some-label": true,
        "every-label": true,
        excluded: false,
        recursive: false,
      },
    ],
  });

  assertEqual(getModuleUrl(module), "protocol://host/base/script.js");

  // present function //
  {
    const info = {
      parameters: ["x"],
      shallow: true,
      link: {
        defined_class: "script",
        method_id: "f",
        path: "./script.js",
        lineno: 2,
        static: false,
      },
    };
    assertDeepEqual(lookupModuleClosure(module, { line: 2, column: 6 }), info);
    assertDeepEqual(lookupModuleClosure(module, { line: 2, column: 6 }), info);
    assertDeepEqual(lookupModuleClosure(module, { line: 2, column: 10 }), info);
  }

  // excluded function //
  assertEqual(lookupModuleClosure(module, { line: 3, column: 8 }), null);

  // missing function //
  assertEqual(lookupModuleClosure(module, { line: 4, column: 8 }), null);

  assertDeepEqual(toModuleClassmap(module), [
    {
      type: "class",
      name: "script",
      children: [
        {
          type: "function",
          name: "f",
          location: "./script.js:2",
          static: false,
          source: "function f (x) {}",
          comment: null,
          labels: [],
        },
      ],
    },
  ]);
}
