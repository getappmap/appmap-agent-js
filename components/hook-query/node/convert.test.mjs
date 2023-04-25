import { assertDeepEqual } from "../../__fixture__.mjs";
import { toParameterCollection } from "./convert.mjs";

const { Set, Symbol, Map } = globalThis;

assertDeepEqual(toParameterCollection([123, 456, 789]), [123, 456, 789]);

assertDeepEqual(
  toParameterCollection(new Set([123, 456, 789])),
  [123, 456, 789],
);

assertDeepEqual(toParameterCollection({ key: 123, [Symbol("sym")]: 456 }), {
  key: 123,
});

assertDeepEqual(
  toParameterCollection(
    new Map([
      ["key", 123],
      [Symbol("sym"), 456],
    ]),
  ),
  { key: 123 },
);

assertDeepEqual(toParameterCollection(null), {});
