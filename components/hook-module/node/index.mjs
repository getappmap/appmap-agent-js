import { InternalAppmapError } from "../../error/index.mjs";
import { hook as hookCjs, unhook as unhookCjs } from "./cjs.mjs";
import { hook as hookEsm, unhook as unhookEsm } from "./esm.mjs";
import { hook as hookJest, unhook as unhookJest } from "./jest.mjs";

export const unhook = (backup) => {
  if (backup.type === "jest") {
    unhookJest(backup.jest);
  } else if (backup.type === "node") {
    unhookCjs(backup.cjs);
    unhookEsm(backup.esm);
  } /* c8 ignore start */ else {
    throw InternalAppmapError("invalid backup type for module");
  } /* c8 ignore stop */
};

export const hook = (agent, configuration) => {
  if (configuration.recorder === "jest") {
    return {
      type: "jest",
      jest: hookJest(agent, configuration),
    };
  } else {
    return {
      type: "node",
      cjs: hookCjs(agent, configuration),
      esm: hookEsm(agent, configuration),
    };
  }
};
