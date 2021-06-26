import { setSimpleVisitor, visit } from "./visit.mjs";
import { test } from "./__fixture__.mjs";
import "./visit-program.mjs";
import "./visit-statement.mjs";

for (let type of ["Literal", "Identifier"]) {
  setSimpleVisitor(
    type,
    (node, context) => [],
    (node, context) => node,
  );
}

setSimpleVisitor(
  "ArrowFunctionExpression",
  (node, context) => [visit(node.body, context, node)],
  (node, context, child) => ({
    ...node,
    body: child,
  }),
);

////////////
// Atomic //
////////////

test(`;`);

test(`throw x;`);

test(`123;`);

test(`debugger;`);

test(`l: break l;`);
test(`while (123) break;`);

test(`l: while (123) continue l;`);
test(`while (123) continue;`);

/////////////////
// Declaration //
/////////////////

test(`let x = 123, y;`);

test(`import {x as y, z} from "source";`, { type: "module" });
test(`import * as x from "source";`, { type: "module" });
test(`import x from "source";`, { type: "module" });

test(
  `
    let x, z;
    export {x as y, z};
  `,
  { type: "module" },
);
test(`export {x as y} from "source";`, { type: "module" });
test(`export let x;`, { type: "module" });
test(`export * from "source";`, { type: "module" });
test(`export default 123;`, { type: "module" });

//////////////
// Compound //
//////////////

test(`{ 123; }`);

test(`with (123) 456;`);

test(`l: { 123; }`);

test(`if (123) 456; else 789;`);
test(`if (123) 456;`);

test(`try { 123; } catch { 456; } finally { 789; }`);
test(`try { 123; } catch (x) { 456; }`);
test(`try { 123; } finally { 456; }`);

test(`while (123) 456;`);
test(`do 456; while (123)`);

test(`for (123; 456; 789) 0;`);
test(`for (;;) 123;`);

test(`for (x of 123) 456;`);
test(`(async () => { for await (x of 123) 456; });`);

test(`for (x in 123) 456;`);

test(`switch (123) {
  case 456: 789;
  default: 0;
}`);
