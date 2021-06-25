import { testScript } from "./__fixture__.mjs";
import { setVisitor, visit } from "./visit.mjs";
import "./visit-program.mjs";
import "./visit-statement.mjs";
import "./visit-expression.mjs";

for (let type of ["Identifier"]) {
  setVisitor(
    type,
    (node, context) => [],
    (node, context) => node,
  );
}

setVisitor(
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
testScript(`(class { constructor () { super[x]; })`);
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
testScript(`(function async () { await x; })`);
// YieldExpression
testScript(`(function * () { yield x; })`);
testScript(`(function * () { yield* x; })`);
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
