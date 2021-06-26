import { test } from "./__fixture__.mjs";
import "./visit-program.mjs";
import "./visit-statement.mjs";
import "./visit-expression.mjs";
import "./visit-identifier.mjs";
import "./visit-pattern.mjs";

Error.stackTraceLimit = Infinity;

test(`const {k:x, [l]:y, ...z} = 123;`);

test(`const [x = y,,...z] = 123;`);
