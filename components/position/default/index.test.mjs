import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  parsePosition,
  stringifyPosition,
  measurePositionDistance,
  resolvePosition,
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

assertEqual(
  measurePositionDistance(
    { line: 10, column: 100 },
    { line: 12, column: 102 },
    { line_weight: 4, column_weight: 2 },
  ),
  4 * (12 - 10) + 2 * (102 - 100),
);

/////////////////////
// resolvePosition //
/////////////////////

const options = {
  threshold: 100,
  line_weight: 1,
  column_weight: 1,
};

// Miss >> empty //
assertDeepEqual(
  resolvePosition(new Map(), { line: 123, column: 456 }, options),
  null,
);

// Miss >> too far //
assertDeepEqual(
  resolvePosition(
    new Map([[stringifyPosition({ line: 0, column: 0 })]]),
    {
      line: MAX_SAFE_INTEGER,
      column: 0,
    },
    options,
  ),
  null,
);

// Hit >> bullseye //
assertDeepEqual(
  resolvePosition(
    new Map([[stringifyPosition({ line: 123, column: 456 }), "value"]]),
    {
      line: 123,
      column: 456,
    },
    options,
  ),
  { line: 123, column: 456 },
);

// Hit >> near //
assertDeepEqual(
  resolvePosition(
    new Map([[stringifyPosition({ line: 123, column: 456 }), "value"]]),
    {
      line: 123,
      column: 457,
    },
    options,
  ),
  { line: 123, column: 456 },
);
