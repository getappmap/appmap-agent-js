import { assertEqual } from "../../../__fixture__.mjs";
import { parseEstree } from "./parse.mjs?env=test";
import { lookupEstreePath } from "./lookup.mjs?env=test";

assertEqual(
  lookupEstreePath(
    parseEstree("protocol://host/path.js", "123;"),
    (node) => node.type === "Literal",
    { line: 1, column: 0 },
  ),
  "/body/0/expression",
);

assertEqual(
  lookupEstreePath(
    parseEstree("protocol://host/path.js", "123;"),
    (_node) => false,
    {
      line: 1,
      column: 0,
    },
  ),
  null,
);

assertEqual(
  lookupEstreePath(
    parseEstree("protocol://host/path.js", "123;"),
    (_node) => true,
    {
      line: 2,
      column: 0,
    },
  ),
  null,
);
