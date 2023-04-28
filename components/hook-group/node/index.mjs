import { createHook } from "node:async_hooks";
import { recordGroup } from "../../frontend/index.mjs";

const { Set } = globalThis;

export const hook = (frontend, { ordering }) => {
  if (ordering !== "causal") {
    return null;
  } else {
    const groups = new Set();
    const hook = createHook({
      init: (id, description, origin) => {
        // In the presence of a debugger, the init hook may be called multiple times for the same asyncId.
        // However, the asyncId is guaranteed to be unique so we should be able to safely ignore it if it's
        // already been seen.
        /* c8 ignore next 3 */
        if (groups.has(id)) {
          return;
        }
        groups.add(id);
        recordGroup(frontend, origin, id, description);
      },
    });
    hook.enable();
    return hook;
  }
};

export const unhook = (hook) => {
  if (hook !== null) {
    hook.disable();
  }
};
