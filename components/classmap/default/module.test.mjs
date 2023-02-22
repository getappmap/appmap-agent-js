import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { createSource } from "../../source/index.mjs";
import {
  createModule,
  getModuleRelativeUrl,
  lookupModuleClosure,
  toModuleClassmap,
} from "./module.mjs";

// empty module //
assertEqual(
  lookupModuleClosure(
    createModule({
      source: createSource("protocol://host/home/dirname/basename.js", `123;`),
      pruning: true,
      inline: true,
      shallow: true,
      relative: "dirname/basename.js",
      exclusions: [],
    }),
    { line: 123, column: 456 },
  ),
  null,
);

{
  const module = createModule({
    source: createSource(
      "protocol://host/home/dirname/basename.js",
      `
        function f (x) {}
        function g (y) {}
        var o = {};
      `,
    ),
    pruning: true,
    inline: true,
    shallow: true,
    relative: "dirname/basename.js",
    exclusions: [
      {
        combinator: "or",
        name: false,
        "qualified-name": "^basename\\.g$",
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

  assertEqual(getModuleRelativeUrl(module), "dirname/basename.js");

  // present function //
  {
    const info = {
      parameters: ["x"],
      shallow: true,
      link: {
        defined_class: "basename",
        method_id: "f",
        path: "dirname/basename.js",
        lineno: 2,
        static: false,
      },
    };
    assertDeepEqual(lookupModuleClosure(module, { line: 2, column: 8 }), info);
    assertDeepEqual(lookupModuleClosure(module, { line: 2, column: 8 }), info);
    assertDeepEqual(lookupModuleClosure(module, { line: 2, column: 10 }), info);
  }

  // excluded function //
  assertEqual(lookupModuleClosure(module, { line: 3, column: 8 }), null);

  // missing function //
  assertEqual(lookupModuleClosure(module, { line: 4, column: 8 }), null);

  assertDeepEqual(toModuleClassmap(module), [
    {
      type: "class",
      name: "basename",
      children: [
        {
          type: "function",
          name: "f",
          location: "dirname/basename.js:2",
          static: false,
          source: "function f (x) {}",
          comment: null,
          labels: [],
        },
      ],
    },
  ]);
}
