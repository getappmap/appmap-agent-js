const VirtualMachine = require("vm");
exports.run = (script) => VirtualMachine.runInThisContext(script);
