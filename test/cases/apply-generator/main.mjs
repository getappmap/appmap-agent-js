import { strict as Assert } from "node:assert";
const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;
const { undefined } = globalThis;
function* g(x) {
  assertEqual(yield 1 * x, "bar");
  assertEqual(yield 2 * x, undefined);
  assertEqual(yield* [3 * x, 4 * x], undefined);
  return "result";
}
const i = g(2);
assertDeepEqual(i.next("foo"), { value: 2, done: false });
assertDeepEqual(i.next("bar"), { value: 4, done: false });
assertDeepEqual(i.next(), { value: 6, done: false });
assertDeepEqual(i.next("qux"), { value: 8, done: false });
assertDeepEqual(i.next(), { value: "result", done: true });
assertDeepEqual(i.next(), { value: undefined, done: true });
