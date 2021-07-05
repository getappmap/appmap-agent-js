import { strict as Assert } from "assert";
import * as Escodegen from "escodegen";
import * as Acorn from "acorn";
import createInstrumenter from "./index.mjs";

const instrumenter = createInstrumenter({}, {});

const format = (code) =>
  Escodegen.generate(Acorn.parse(code, { ecmaVersion: 2020 }));

Assert.deepEqual(
  instrumenter.instrument("script", "script1.js", "(class c {});"),
  {
    code: format("(class c {});"),
    entity: {
      type: "package",
      name: "script1.js",
      source: null,
      children: [
        {
          type: "class",
          caption: { origin: "ClassExpression", name: "c" },
          index: 1,
          children: [],
        },
      ],
    },
  },
);

Assert.deepEqual(
  instrumenter.instrument("script", "script2.js", "123;", { source: true }),
  {
    code: format("123;"),
    entity: {
      type: "package",
      name: "script2.js",
      source: "123;",
      children: [],
    },
  },
);
