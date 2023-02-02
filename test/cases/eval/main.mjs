/* eslint-disable no-eval */
/* eslint local/no-globals: ["error", "eval"] */
function f() {}
f();
const codes = ["function g () {}; g();", "function h () {}; h();"];
for (const code of codes) {
  eval(code);
}
