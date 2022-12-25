/* eslint-disable no-eval */
/* eslint local/no-globals: ["error", "eval"] */
function f() {}
f();
eval("function g () {}; g();");
