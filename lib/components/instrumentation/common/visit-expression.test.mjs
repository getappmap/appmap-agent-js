import { setSimpleVisitor, visit } from "./visit.mjs";
import { test } from "./__fixture__.mjs";
import "./visit-program.mjs";
import "./visit-expression.mjs";

setSimpleVisitor(
  "Identifier",
  (node, context) => [],
  (node, context) => node,
);

setSimpleVisitor(
  "ExpressionStatement",
  (node, context) => [visit(node.expression, context, node)],
  (node, context, child) => ({
    type: "ExpressionStatement",
    expression: child,
  }),
);

setSimpleVisitor(
  "BlockStatement",
  (node, context) => [node.body.map((child) => visit(child, context, node))],
  (node, context, children) => ({
    type: "BlockStatement",
    body: children,
  }),
);

setSimpleVisitor(
  "FunctionExpression",
  (node, context) => [visit(node.body, context, node)],
  (node, context, child) => ({
    ...node,
    body: child,
  }),
);

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
test(`[x, ...y,, z];`);
// ObjectExpression
test(`({x:123, get [y] () {}, ...z});`);
// FunctionExpression
// ArrowFunctionExpression

/////////////////
// Environment //
/////////////////

// ThisExpression
test(`this;`);
// SuperExpression
test(`({foo () { super.bar; }});`);
// AssignmentExpression
test(`x += y;`);
// UpdateExpression
test(`x++;`);
test(`--x;`);
// ImportExpression
test(`import(x);`);
// ChainExpression
test(`x?.[y];`);
// AwaitExpression
test(`(async function () { await x; });`);
// YieldExpression
test(`(function * () { yield x; });`);
test(`(function * () { yield* x; });`);
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
