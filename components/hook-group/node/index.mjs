const { Set, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { createHook } from "async_hooks";
import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import { recordGroup } from "../../agent/index.mjs";

export const hook = (agent, { ordering }) => {
  if (ordering !== "causal") {
    return null;
  } else {
    const groups = new Set();
    const hook = createHook({
      init: (id, description, _origin) => {
        assert(!groups.has(id), "duplicate async id", InternalAppmapError);
        groups.add(id);
        recordGroup(agent, id, description);
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
