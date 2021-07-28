import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import { testVisitor } from "./__fixture__.mjs";
import VisitExpression from "./visit-expression.mjs";

const testAsync = async () => {
  const visitors = VisitExpression(
    await buildAsync({ violation: "error", assert: "debug", util: "default" }),
  );

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
  {
    const sieve = testVisitor(
      `({foo:123});`,
      ["body", 0, "expression"],
      visitors,
      {
        info: { name: null },
      },
    );
    Assert.deepEqual(
      sieve([
        { outline: { caption: { origin: "FooBar" } } },
        { outline: { caption: { origin: "Property" } } },
      ]),
      [
        [{ outline: { caption: { origin: "Property" } } }],
        [{ outline: { caption: { origin: "FooBar" } } }],
      ],
    );
  }
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

testAsync();
