import { hook as hookCjs, unhook as unhookCjs } from "./cjs.mjs";
import { hook as hookEsm, unhook as unhookEsm } from "./esm.mjs";

export const unhook = (backup) => {
  unhookCjs(backup.cjs);
  unhookEsm(backup.esm);
};

export const hook = (agent, config) => ({
  cjs: hookCjs(agent, config),
  esm: hookEsm(agent, config),
});
