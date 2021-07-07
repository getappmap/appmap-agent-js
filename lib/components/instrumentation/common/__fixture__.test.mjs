import { strict as Assert } from "assert";
import { setSimpleVisitor } from "./visit.mjs";
import { test } from "./__fixture__.mjs";

Error.stackTraceLimit = Infinity;

setSimpleVisitor(
  "Program",
  (node, context) => [],
  (node, context) => node,
);

Assert.equal(test("", { entities: [] }), null);
Assert.deepEqual(test("", { entities: null }), []);
