
import VirtualMachine from "vm";

const runScript = (script) => {
  VirtualMachine.runInThisContext(script);
}

export default (dependencies, options) => () => ({runScript});
