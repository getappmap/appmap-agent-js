import { assert, assertDeepEqual } from "../../__fixture__.mjs";
import {
  parsePosition,
  stringifyPosition,
  measurePositionDistance,
} from "./position.mjs";

{
  const position = { line: 123, column: 456 };
  assertDeepEqual(position, parsePosition(stringifyPosition(position)));
}

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
