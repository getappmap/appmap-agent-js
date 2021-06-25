import { setVisitor } from "./visit.mjs";
import { testScript } from "./__fixture__.mjs";
import "./visit-program.mjs";

setVisitor(
  "EmptyStatement",
  (node, context) => [],
  (node, context) => ({
    type: "DebuggerStatement",
  }),
);

testScript(";", "debugger;");
