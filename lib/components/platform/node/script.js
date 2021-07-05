
import VirtualMachine from "vm";

export const runScript = (script) => {
  VirtualMachine.runInThisContext(script);
};
