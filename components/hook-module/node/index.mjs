import { hook as hookCjs, unhook as unhookCjs } from "./cjs.mjs";
import { hook as hookEsm, unhook as unhookEsm } from "./esm.mjs";

export const unhook = (backup) => {
  if (backup !== null) {
    unhookCjs(backup.cjs);
    unhookEsm(backup.esm);
  }
};

export const hook = (agent, configuration) => {
  if (configuration.recorder === "jest") {
    return null;
  } else {
    return {
      cjs: hookCjs(agent, configuration),
      esm: hookEsm(agent, configuration),
    };
  }
};
