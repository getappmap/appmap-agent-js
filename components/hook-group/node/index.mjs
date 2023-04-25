import { createHook } from "node:async_hooks";
import { toString } from "../../util/index.mjs";
import { logWarning } from "../../log/index.mjs";
import { recordGroup } from "../../frontend/index.mjs";

const {
  Set,
  Number: { isInteger, MAX_SAFE_INTEGER },
} = globalThis;

// NB: current execution id when called from C++ is 0
const isGroup = (group) =>
  isInteger(group) && group >= 0 && group < MAX_SAFE_INTEGER;

export const hook = (frontend, { ordering }) => {
  if (ordering !== "causal") {
    return null;
  } else {
    const groups = new Set();
    const hook = createHook({
      init: (id, description, origin) => {
        if (isGroup(id) && isGroup(origin)) {
          // In the presence of a debugger, the init hook may be called multiple times for the same asyncId.
          // However, the asyncId is guaranteed to be unique so we should be able to safely ignore it if it's
          // already been seen.
          if (!groups.has(id)) {
            groups.add(id);
            recordGroup(frontend, origin, id, toString(description));
          }
        } /* c8 ignore start */ else {
          logWarning("Invalid group id for id = %o or origin = %o", id, origin);
        } /* c8 ignore stop */
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
