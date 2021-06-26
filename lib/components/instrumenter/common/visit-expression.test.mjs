import { testScript } from "./__fixture__.mjs";
import { setSimpleVisitor, visit } from "./visit.mjs";
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
testScript(`"foo";`);
testScript(`123n;`);
testScript(`/abc/g;`);
// TemplateLiteral
testScript(`\`foo\${x}bar\${y}qux\`;`);
// TaggedTemplateExpression
testScript(`f\`foo\${x}bar\`;`);
// ArrayExpression
testScript(`[x, ...y,, z];`);
// ObjectExpression
testScript(`({x:123, get [y] () {}, ...z});`);
// FunctionExpression
// ArrowFunctionExpression

/////////////////
// Environment //
/////////////////

// ThisExpression
testScript(`this;`);
// SuperExpression
testScript(`({foo () { super.bar; }});`);
// AssignmentExpression
testScript(`x += y;`);
// UpdateExpression
testScript(`x++;`);
testScript(`--x;`);
// ImportExpression
testScript(`import(x);`);
// ChainExpression
testScript(`x?.[y];`);
// AwaitExpression
testScript(`(async function () { await x; });`);
// YieldExpression
testScript(`(function * () { yield x; });`);
testScript(`(function * () { yield* x; });`);
// ConditionalExpression
testScript(`x ? y : z;`);
// LogicalExpression
testScript(`x || y;`);
// SequenceExpression
testScript(`(x, y);`);
// MemberExpression
testScript(`x[y];`);
testScript(`x.y;`);
// BinaryExpression
testScript(`x + y;`);
// UnaryExpression
testScript(`!x;`);
// CallExpression
testScript(`f(x, ...y, z);`);
// NewExpression`
testScript(`new f(x, ...y, z);`);
