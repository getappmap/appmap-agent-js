import { strict as Assert } from "assert";
import * as Escodegen from "escodegen";
import * as Acorn from "acorn";
import { Instrumenter } from "./index.mjs";

const instrumenter = new Instrumenter();

Assert.equal(
  instrumenter.instrument("script", "script1.js", "(class c {});"),
  Escodegen.generate(Acorn.parse("(class c {});", { ecmaVersion: 2020 })),
);

Assert.equal(
  instrumenter.instrument("script", "script2.js", "123;", { source: true }),
  Escodegen.generate(Acorn.parse("123;", { ecmaVersion: 2020 })),
);

Assert.deepEqual(instrumenter.getPackages(), [
  {
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
  {
    type: "package",
    name: "script2.js",
    source: "123;",
    children: [],
  },
]);
