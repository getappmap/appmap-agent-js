import { setSimpleVisitor } from "./visit.mjs";
import { testScript } from "./__fixture__.mjs";
import "./visit-program.mjs";

setSimpleVisitor(
  "EmptyStatement",
  (node, context) => [],
  (node, context) => ({
    type: "DebuggerStatement",
  }),
);

testScript(";", "debugger;");
