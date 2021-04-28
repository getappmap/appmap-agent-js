const cp = require("child_process");
const copy = {...cp};
// Error.prototype.
Error.stackTraceLimit = Infinity;
cp.spawn = (...args) => {
  console.log(new Error("FOOBAR").stack);
  console.log(...args);
  return copy.spawn(...args);
};
