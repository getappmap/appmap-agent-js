import { assertEqual } from "../../__fixture__.mjs";
import { createSource, parseSource } from "../../source/index.mjs";
import { lookupEstreePath } from "./lookup.mjs";

const source = createSource("protocol://host/path.js", "123;");

assertEqual(
  lookupEstreePath(parseSource(source), (node) => node.type === "Literal", {
    line: 1,
    column: 0,
  }),
  "/body/0/expression",
);

assertEqual(
  lookupEstreePath(parseSource(source), (_node) => false, {
    line: 1,
    column: 0,
  }),
  null,
);

assertEqual(
  lookupEstreePath(parseSource(source), (_node) => true, {
    line: 2,
    column: 0,
  }),
  null,
);
