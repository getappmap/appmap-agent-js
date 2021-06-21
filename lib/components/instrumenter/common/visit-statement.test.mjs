import { test } from './__fixture__.mjs';
import '../../../../../lib/server/instrument/visit-statement.mjs';

Error.stackTraceLimit = Infinity;

const testStatement = (code, source = 'script') =>
  test({
    input: code,
    source,
    keys: [['body', 0]],
  });

////////////
// Atomic //
////////////

testStatement(`;`);

testStatement(`throw x;`);

testStatement(`123;`);

testStatement(`debugger;`);

test({
  input: `l: break l;`,
  keys: [['body', 0], 'body'],
});
test({
  input: `while (123) break;`,
  keys: [['body', 0], 'body'],
});

test({
  input: `l: while (123) continue l;`,
  keys: [['body', 0], 'body', 'body'],
});
test({
  input: `while (123) continue;`,
  keys: [['body', 0], 'body'],
});

/////////////////
// Declaration //
/////////////////

testStatement(`let x = 123, y;`);

testStatement(`import {x as y, z} from "source";`, 'module');
testStatement(`import * as x from "source";`, 'module');
testStatement(`import x from "source";`, 'module');

test({
  source: 'module',
  input: `
    let x, z;
    export {x as y, z};`,
  keys: [['body', 1]],
});
testStatement(`export {x as y} from "source";`, 'module');
testStatement(`export let x;`, 'module');
testStatement(`export * from "source";`, 'module');
testStatement(`export default 123;`, 'module');

//////////////
// Compound //
//////////////

testStatement(`{ 123; }`);

testStatement(`with (123) 456;`);

testStatement(`l: { 123; }`);

testStatement(`if (123) 456; else 789;`);
testStatement(`if (123) 456;`);

testStatement(`try { 123; } catch { 456; } finally { 789; }`);
testStatement(`try { 123; } catch (x) { 456; }`);
testStatement(`try { 123; } finally { 456; }`);

testStatement(`while (123) 456;`);
testStatement(`do 456; while (123)`);

testStatement(`for (123; 456; 789) 0;`);
testStatement(`for (;;) 123;`);

testStatement(`for (x of 123) 456;`);
test({
  input: `(async () => { for (x of await 123) 456; });`,
  keys: [['body', 0], 'expression', 'body', ['body', 0]],
});

testStatement(`for (x in 123) 456;`);

testStatement(`switch (123) {
  case 456: 789;
  default: 0;
}`);
