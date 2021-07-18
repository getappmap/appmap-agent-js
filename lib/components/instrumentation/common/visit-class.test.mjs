import { strict as Assert } from "assert";
import { buildAllAsync } from "../../../build.mjs";
import { testVisitor } from "./__fixture__.mjs";
import VisitClass from "./visit-class.mjs";

Error.stackTraceLimit = Infinity;

const mainAsync = async () => {
  const dependencies = await buildAllAsync(["util"]);
  const visitors = VisitClass(dependencies);
  {
    const sieve = testVisitor("class C extends D {}", ["body", "0"], visitors, {
      info: { name: "C" },
    });
    Assert.deepEqual(
      sieve([
        { entity: { caption: { origin: "MethodDefinition" } } },
        { entity: { caption: { origin: "FooBar" } } },
      ]),
      [
        [{ entity: { caption: { origin: "MethodDefinition" } } }],
        [{ entity: { caption: { origin: "FooBar" } } }],
      ],
    );
  }
  testVisitor("(class C {});", ["body", "0", "expression"], visitors, {
    info: { name: "C" },
  });
  testVisitor("(class {});", ["body", "0", "expression"], visitors, {
    info: { name: null },
  });
  testVisitor(
    "export default class {}",
    ["body", "0", "declaration"],
    visitors,
    {
      kind: "module",
      info: { name: null },
    },
  );
  testVisitor("class C { foo () {} }", ["body", "0", "body"], visitors);
  testVisitor(
    "class C { constructor (foo) { bar; } }",
    ["body", "0", "body", "body", "0"],
    visitors,
  );
  testVisitor(
    "class C { static set foo (bar) { qux; } }",
    ["body", "0", "body", "body", "0"],
    visitors,
  );
};

mainAsync();
