import { buildAllAsync } from "../../../build.mjs";
import { testVisitor } from "./__fixture__.mjs";
import VisitExpression from "./visit-expression.mjs";

const mainAsync = async () => {
  const visitors = VisitExpression(await buildAllAsync([]));

  const test = (code, keys = ["body", 0, "expression"]) =>
    testVisitor(code, keys, visitors);

  /////////////
  // Literal //
  /////////////

  // Literal
  test(`"foo";`);
  test(`123n;`);
  test(`/abc/g;`);
  // TemplateLiteral
  test(`\`foo\${x}bar\${y}qux\`;`);
  // TaggedTemplateExpression
  test(`f\`foo\${x}bar\`;`);
  // ArrayExpression
  test(`[foo,,bar];`);
  // SpreadElement
  test(`[...x];`, ["body", 0, "expression", "elements", 0]);
  // ObjectExpression
  test(`({foo:123});`);
  // Property //
  test(`({get [foo] () {}});`, ["body", 0, "expression", "properties", 0]);
  // FunctionExpression
  // ArrowFunctionExpression

  /////////////////
  // Environment //
  /////////////////

  // ThisExpression
  test(`this;`);
  // SuperExpression
  test(`({foo () { super.bar; }});`, [
    "body",
    0,
    "expression",
    "properties",
    0,
    "value",
    "body",
    "body",
    0,
    "expression",
    "object",
  ]);
  // AssignmentExpression
  test(`x += y;`);
  // UpdateExpression
  test(`x++;`);
  test(`--x;`);

  /////////////
  // Control //
  /////////////

  // ImportExpression
  test(`import(x);`);
  // ChainExpression
  test(`x?.[y];`);
  // AwaitExpression
  test(`(async function () { await x; });`, [
    "body",
    0,
    "expression",
    "body",
    "body",
    0,
    "expression",
  ]);
  // YieldExpression
  test(`(function * () { yield x; });`, [
    "body",
    0,
    "expression",
    "body",
    "body",
    0,
    "expression",
  ]);
  test(`(function * () { yield* x; });`, [
    "body",
    0,
    "expression",
    "body",
    "body",
    0,
    "expression",
  ]);

  /////////////////
  // Combination //
  /////////////////

  // ConditionalExpression
  test(`x ? y : z;`);
  // LogicalExpression
  test(`x || y;`);
  // SequenceExpression
  test(`(x, y);`);
  // MemberExpression
  test(`x[y];`);
  test(`x.y;`);
  // BinaryExpression
  test(`x + y;`);
  // UnaryExpression
  test(`!x;`);
  // CallExpression
  test(`f(x, ...y, z);`);
  // NewExpression`
  test(`new f(x, ...y, z);`);
};

mainAsync();
