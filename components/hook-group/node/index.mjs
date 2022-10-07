const { Set, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { createHook } from "async_hooks";
const { assert } = await import(`../../util/index.mjs${__search}`);
const { recordGroup } = await import(`../../agent/index.mjs${__search}`);

export const hook = (agent, { ordering }) => {
  if (ordering !== "causal") {
    return null;
  } else {
    const groups = new Set();
    const hook = createHook({
      init: (id, description, _origin) => {
        assert(!groups.has(id), "duplicate async id");
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
