import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { parseEstree } from "../../parse/index.mjs";
import {
  createSource,
  applyExclusionCriteria,
  resolveClosurePosition,
  lookupClosurePosition,
  exportClassmap,
} from "./index.mjs";

const { undefined } = globalThis;

const default_criterion = {
  combinator: "and",
  name: true,
  "qualified-name": true,
  "some-label": true,
  "every-label": true,
  excluded: false,
  recursive: false,
};

const createSourceHelper = (url, content) =>
  createSource({
    url,
    content,
    program: parseEstree({ url, content }),
  });

////////////////////////////
// resolveClosurePosition //
////////////////////////////

assertDeepEqual(
  resolveClosurePosition(
    createSourceHelper("protocol://host/directory/file.ext", "123;"),
    { line: 1, column: 0 },
  ),
  null,
);

assertDeepEqual(
  resolveClosurePosition(
    createSourceHelper(
      "protocol://host/directory/file.ext",
      "function f () {}",
    ),
    { line: 1, column: 1 },
  ),
  {
    line: 1,
    column: 0,
  },
);

///////////////////////////
// lookupClosurePosition //
///////////////////////////

assertDeepEqual(
  lookupClosurePosition(
    createSourceHelper("protocol://host/directory/file.ext", "123;"),
    { line: 1, column: 0 },
  ),
  null,
);

assertDeepEqual(
  lookupClosurePosition(
    createSourceHelper(
      "protocol://host/directory/file.ext",
      "function f (x, y, z) {}",
    ),
    { line: 1, column: 1 },
  ),
  {
    position: { line: 1, column: 0 },
    parameters: ["x", "y", "z"],
    parent: "file",
    name: "f",
    static: false,
  },
);

////////////////////
// exportClassmap //
////////////////////

assertDeepEqual(
  exportClassmap(
    createSourceHelper(
      "protocol://host/directory/file.ext",
      "/* @label foo */ /* @label bar */ function f (x, y, z) {}",
    ),
    { inline: true, pruning: false, specifier: "specifier" },
  ),
  [
    {
      type: "class",
      name: "file",
      children: [
        {
          type: "function",
          name: "f",
          static: false,
          location: "specifier:1",
          source: "function f (x, y, z) {}",
          comment: "/* @label foo */\n/* @label bar */",
          labels: ["foo", "bar"],
        },
      ],
    },
  ],
);

assertDeepEqual(
  exportClassmap(
    createSourceHelper(
      "file:///w:/host/directory/file.ext",
      "function f () { var o = {}; }",
    ),
    { inline: false, pruning: false, specifier: "specifier" },
  ),
  [
    {
      type: "class",
      name: "file",
      children: [
        {
          type: "function",
          name: "f",
          static: false,
          location: "specifier:1",
          source: null,
          comment: null,
          labels: [],
        },
        {
          type: "class",
          name: "f",
          children: [
            {
              type: "class",
              name: "o",
              children: [],
            },
          ],
        },
      ],
    },
  ],
);

assertDeepEqual(
  exportClassmap(
    createSourceHelper("protocol://host/directory/file.ext", "var o = {};"),
    { inline: true, pruning: false },
  ),
  [
    {
      type: "class",
      name: "o",
      children: [],
    },
  ],
);

assertDeepEqual(
  exportClassmap(
    createSourceHelper("protocol://host/directory/file.ext", "var o = {};"),
    { inline: true, pruning: true },
  ),
  [],
);

assertDeepEqual(
  exportClassmap(
    createSourceHelper(
      "protocol://host/directory/file.ext",
      "function f () {}",
    ),
    { inline: true, pruning: true },
  ),
  [],
);

////////////////////////////
// applyExclusionCriteria //
////////////////////////////

for (const recursive of [true, false]) {
  const source = createSourceHelper(
    "protocol://host/directory/file.ext",
    "function f () { function g () {}; }",
  );
  assertEqual(
    applyExclusionCriteria(source, [
      {
        ...default_criterion,
        name: "f",
        excluded: true,
        recursive,
      },
      default_criterion,
    ]),
    undefined,
  );
  assertEqual(resolveClosurePosition(source, { line: 1, column: 0 }), null);
  assertEqual(lookupClosurePosition(source, { line: 1, column: 0 }), null);
  assertDeepEqual(
    resolveClosurePosition(source, { line: 1, column: 16 }),
    recursive ? null : { line: 1, column: 16 },
  );
  assertDeepEqual(
    exportClassmap(source, {
      inline: false,
      pruning: false,
      specifier: "specifier",
    }),
    recursive
      ? []
      : [
          {
            type: "function",
            name: "g",
            static: false,
            location: "specifier:1",
            source: null,
            comment: null,
            labels: [],
          },
        ],
  );
}
