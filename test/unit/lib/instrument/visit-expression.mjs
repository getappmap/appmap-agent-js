import { testExpression, testSpecialExpression } from './__fixture__.mjs';
import '../../../../lib/instrument/visit-expression.mjs';

Error.stackTraceLimit = Infinity;

/////////////
// Literal //
/////////////

// Literal
testExpression(`"foo"`);
testExpression(`123n`);
testExpression(`/abc/g`);
// TemplateLiteral
testExpression(`\`foo\${x}bar\${y}qux\``);
// TaggedTemplateExpression
testExpression(`f\`foo\${x}bar\``);
// ArrayExpression
testExpression(`[x, ...y,, z]`);
// ObjectExpression
testExpression(`{x:123, get [y] () {}, ...z}`);
// FunctionExpression
// ArrowFunctionExpression

/////////////////
// Environment //
/////////////////

// ThisExpression
testExpression(`this`);
// SuperExpression
testSpecialExpression(`super[x]`);
// AssignmentExpression
testExpression(`x += y`);
// UpdateExpression
testExpression(`x++`);
testExpression(`--x`);
// ImportExpression
testExpression(`import(x)`);
// ChainExpression
testExpression(`x?.[y]`);
// AwaitExpression
testSpecialExpression(`await x`);
// YieldExpression
testSpecialExpression(`yield x`);
testSpecialExpression(`yield* x`);
// ConditionalExpression
testExpression(`x ? y : z`);
// LogicalExpression
testExpression(`x || y`);
// SequenceExpression
testExpression(`(x, y)`);
// MemberExpression
testExpression(`x[y]`);
testExpression(`x.y`);
// BinaryExpression
testExpression(`x + y`);
// UnaryExpression
testExpression(`!x`);
// CallExpression
testExpression(`f(x, ...y, z)`);
// NewExpression`
testExpression(`new f(x, ...y, z)`);
