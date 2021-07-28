import { buildTestAsync } from "../../../build/index.mjs";
import { testVisitor } from "./__fixture__.mjs";
import VisitStatement from "./visit-statement.mjs";

const testAsync = async () => {
  const visitors = VisitStatement(await buildTestAsync(import.meta));

  const test = (code, keys = ["body", 0], kind = "module") =>
    testVisitor(code, keys, visitors, { kind });

  ////////////
  // Atomic //
  ////////////

  test(`;`);

  test(`throw x;`);

  test(`123;`);

  test(`debugger;`);

  test(`l:break l`, ["body", 0, "body"]);

  test(`l: while (123) continue l;`, ["body", 0, "body", "body"]);

  /////////////////
  // Declaration //
  /////////////////

  test(`let x;`);
  test(`let x = 123`, ["body", 0, "declarations", 0]);

  test(`import {foo} from "source";`);
  test(`import {foo as bar} from "source";`, ["body", 0, "specifiers", 0]);
  test(`import * as x from "source";`, ["body", 0, "specifiers", 0]);
  test(`import x from "source";`, ["body", 0, "specifiers", 0]);

  test(`let x; export {x as y} from "source";`, ["body", 1]);
  test(`let x; export {x as y} from "source";`, ["body", 1, "specifiers", 0]);
  test(`export let x;`);
  test(`export * from "source";`);
  test(`export default 123;`);

  //////////////
  // Compound //
  //////////////

  test(`{ 123; }`);

  test(`with (123) 456;`, undefined, "script");

  test(`l:123;`);

  test(`if (123) 456; else 789;`);

  test(`try { 123; } catch { 456; } finally { 789; }`);
  test(`try { 123; } catch (x) { 456; }`, ["body", 0, "handler"]);

  test(`while (123) 456;`);

  test(`do 456; while (123)`);

  test(`for (123; 456; 789) 0;`);

  test(`for (x in 123) 456;`);

  test(`(async () => { for await (x of 123) 456; });`, [
    "body",
    0,
    "expression",
    "body",
    "body",
    0,
  ]);

  test(`switch (123) { default: 456; }`);

  test(`switch (123) { case 456: 789; }`, ["body", 0, "cases", 0]);
};

testAsync();
