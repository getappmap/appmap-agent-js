import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createModule,
  getModuleRelativeUrl,
  lookupModuleClosure,
  toModuleClassmap,
} from "./module.mjs";

{
  const module = createModule({
    url: "protocol://host/home/dirname/basename.js",
    content: `
      function f (x) {}
      function g (y) {}
      var o = {};
    `,
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
    assertDeepEqual(
      lookupModuleClosure(module, { line: 2, column: 6 }, {}),
      info,
    );
    assertDeepEqual(
      lookupModuleClosure(module, { line: 2, column: 6 }, {}),
      info,
    );
    assertDeepEqual(
      lookupModuleClosure(module, { line: 2, column: 10 }, {}),
      info,
    );
  }

  // excluded function //
  assertEqual(lookupModuleClosure(module, { line: 3, column: 6 }, {}), null);

  // missing function //
  assertEqual(lookupModuleClosure(module, { line: 4, column: 6 }, {}), null);

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
