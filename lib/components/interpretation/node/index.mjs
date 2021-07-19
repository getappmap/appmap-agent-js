import { runInThisContext } from "vm";

export default (dependencies) => {
  return {
    runScript: runInThisContext,
  };
};
