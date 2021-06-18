
const VirtualMachine = require("vm");

const runScript = (script) => {
  VirtualMachine.runInThisContext(script);
}

module.exports = () => { runScript };
