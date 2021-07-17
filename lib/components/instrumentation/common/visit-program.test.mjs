import { setSimpleVisitor } from "./visit.mjs";
import { dive } from "./__fixture__.mjs";

const {Program:{assemble, dismantle}} = Program({});

const {head:node} = dive(";", []);



setSimpleVisitor(
  "EmptyStatement",
  (node, context) => [],
  (node, context) => node,
);

test(";");
