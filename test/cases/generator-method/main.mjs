import { strict as Assert } from "node:assert";
const { throws: assertThrow, deepEqual: assertDeepEqual } = Assert;
const { Error, undefined } = globalThis;

function* g() {
  yield 1;
  yield 2;
  yield 3;
}

{
  const i = g();
  assertDeepEqual(i.next(), { value: 1, done: false });
  assertDeepEqual(i.return("result"), { value: "result", done: true });
  assertDeepEqual(i.next(), { value: undefined, done: true });
}

{
  const i = g();
  assertDeepEqual(i.next(), { value: 1, done: false });
  assertThrow(() => {
    i.throw(new Error("message"));
  }, /^Error: message$/u);
  assertDeepEqual(i.next(), { value: undefined, done: true });
}
