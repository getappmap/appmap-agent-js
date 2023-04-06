import { assert, assertDeepEqual } from "../../__fixture__.mjs";
import {
  parsePosition,
  stringifyPosition,
  measurePositionDistance,
  lookupPosition,
} from "./index.mjs";

const {
  Map,
  Number: { MAX_SAFE_INTEGER },
} = globalThis;

////////////
// format //
////////////

{
  const position = { line: 123, column: 456 };
  assertDeepEqual(position, parsePosition(stringifyPosition(position)));
}

/////////////////////////////
// measurePositionDistance //
/////////////////////////////

{
  const position = { line: 123, column: 456 };
  assert(
    measurePositionDistance(position, {
      ...position,
      line: position.line + 1,
    }) >
      measurePositionDistance(position, {
        ...position,
        column: position.column + 1,
      }),
  );
}

/////////////////////
// lookupPosition //
/////////////////////

// Miss >> empty //
assertDeepEqual(lookupPosition(new Map(), { line: 123, column: 456 }), null);

// Miss >> too far //
assertDeepEqual(
  lookupPosition(new Map([[stringifyPosition({ line: 0, column: 0 })]]), {
    line: MAX_SAFE_INTEGER,
    column: 0,
  }),
  null,
);

// Hit >> bullseye //
assertDeepEqual(
  lookupPosition(
    new Map([[stringifyPosition({ line: 123, column: 456 }), "value"]]),
    {
      line: 123,
      column: 456,
    },
  ),
  [{ line: 123, column: 456 }, "value"],
);

// Hit >> near //
assertDeepEqual(
  lookupPosition(
    new Map([[stringifyPosition({ line: 123, column: 456 }), "value"]]),
    {
      line: 123,
      column: 457,
    },
  ),
  [{ line: 123, column: 456 }, "value"],
);
