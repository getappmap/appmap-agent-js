import { setSimpleVisitor } from "./visit.mjs";
import { test } from "./__fixture__.mjs";
import "./visit-program.mjs";

setSimpleVisitor(
  "EmptyStatement",
  (node, context) => [],
  (node, context) => node,
);

test(";");
