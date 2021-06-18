
const VirtualMachine = require("vm");

exports.runScript = (script) => {
  VirtualMachine.runInThisContext(script);
}
