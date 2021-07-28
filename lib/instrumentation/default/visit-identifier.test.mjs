import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import { testVisitor } from "./__fixture__.mjs";
import VisitIdentifier from "./visit-identifier.mjs";

const { throws: assertThrows } = Assert;

const testAsync = async () => {
  const visitors = VisitIdentifier(
    await buildAsync({ violation: "error", assert: "debug", util: "default" }),
  );

  const test = (code, keys) =>
    testVisitor(code, keys, visitors, {
      kind: "module",
      context: { runtime: "$", path: "path" },
    });

  assertThrows(
    () => test("$;", ["body", 0, "expression"]),
    /^AppmapError: identifier collision/,
  );

  test(`foo;`, ["body", 0, "expression"]);

  test(`$:;`, ["body", 0, "label"]);

  test(`$: break $;`, ["body", 0, "body", "label"]);

  test(`$: while (true) continue $;`, ["body", 0, "body", "body", "label"]);

  test("const foo = 123; export {foo as $};", [
    "body",
    1,
    "specifiers",
    0,
    "exported",
  ]);

  test("import {$ as foo} from './bar.mjs';", [
    "body",
    0,
    "specifiers",
    0,
    "imported",
  ]);

  test("({$: foo});", ["body", 0, "expression", "properties", 0, "key"]);

  test("foo.$;", ["body", 0, "expression", "property"]);
};

testAsync();
