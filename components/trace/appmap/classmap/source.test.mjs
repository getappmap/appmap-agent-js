import { assertEqual, assertDeepEqual } from "../../../__fixture__.mjs";

import {
  createSource,
  getSourceRelativeUrl,
  lookupSourceClosure,
  toSourceClassmap,
} from "./source.mjs";

{
  const source = createSource(
    `
    function f (x) {}
    function g (y) {}
    var o = {};
  `,
    {
      pruning: true,
      inline: true,
      shallow: true,
      relative: "dirname/basename.js",
      url: "protocol://host/home/dirname/basename.js",
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
    },
  );

  assertEqual(getSourceRelativeUrl(source), "dirname/basename.js");

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
      lookupSourceClosure(source, { line: 2, column: 4 }, {}),
      info,
    );
    assertDeepEqual(
      lookupSourceClosure(source, { line: 2, column: 4 }, {}),
      info,
    );
    assertDeepEqual(
      lookupSourceClosure(source, { line: 2, column: 10 }, {}),
      info,
    );
  }

  // excluded function //
  assertEqual(lookupSourceClosure(source, { line: 3, column: 4 }, {}), null);

  // missing function //
  assertEqual(lookupSourceClosure(source, { line: 4, column: 4 }, {}), null);

  assertDeepEqual(toSourceClassmap(source), [
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
