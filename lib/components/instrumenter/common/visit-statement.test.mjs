import { setVisitor, visit } from "./visit.mjs";
import { testScript, testModule } from "./__fixture__.mjs";
import "./visit-program.mjs";
import "./visit-statement.mjs";

for (let type of ["Literal", "Identifier"]) {
  setVisitor(
    type,
    (node, context) => [],
    (node, context) => node,
  );
}

setVisitor(
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

testScript(`;`);

testScript(`throw x;`);

testScript(`123;`);

testScript(`debugger;`);

testScript(`l: break l;`);
testScript(`while (123) break;`);

testScript(`l: while (123) continue l;`);
testScript(`while (123) continue;`);

/////////////////
// Declaration //
/////////////////

testScript(`let x = 123, y;`);

testModule(`import {x as y, z} from "source";`);
testModule(`import * as x from "source";`);
testModule(`import x from "source";`);

testModule(
  `
    let x, z;
    export {x as y, z};
  `,
);
testModule(`export {x as y} from "source";`);
testModule(`export let x;`);
testModule(`export * from "source";`);
testModule(`export default 123;`);

//////////////
// Compound //
//////////////

testScript(`{ 123; }`);

testScript(`with (123) 456;`);

testScript(`l: { 123; }`);

testScript(`if (123) 456; else 789;`);
testScript(`if (123) 456;`);

testScript(`try { 123; } catch { 456; } finally { 789; }`);
testScript(`try { 123; } catch (x) { 456; }`);
testScript(`try { 123; } finally { 456; }`);

testScript(`while (123) 456;`);
testScript(`do 456; while (123)`);

testScript(`for (123; 456; 789) 0;`);
testScript(`for (;;) 123;`);

testScript(`for (x of 123) 456;`);
testScript(`(async () => { for await (x of 123) 456; });`);

testScript(`for (x in 123) 456;`);

testScript(`switch (123) {
  case 456: 789;
  default: 0;
}`);
