import { InternalAppmapError } from "../../error/index.mjs";
import { assert, noop, assignProperty } from "../../util/index.mjs";
import { defineGlobal } from "../../global/index.mjs";
import {
  getFreshTab,
  getSerializationEmptyValue,
  recordBeginEvent,
  recordEndEvent,
  recordBeforeEvent,
  recordAfterEvent,
  formatApplyPayload,
  formatReturnPayload,
  formatThrowPayload,
  formatAwaitPayload,
  formatResolvePayload,
  formatRejectPayload,
  formatYieldPayload,
} from "../../agent/index.mjs";

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

export const hook = (agent, { hooks: { apply: apply_hook_variable } }) => {
  if (apply_hook_variable === null) {
    return [];
  } else {
    const runtime = {
      empty: getSerializationEmptyValue(agent),
      getFreshTab: () => getFreshTab(agent),
      recordApply: (tab, _function, _this, _arguments) => {
        recordBeginEvent(
          agent,
          tab,
          formatApplyPayload(agent, _function, _this, _arguments),
        );
      },
      recordReturn: (tab, _function, result) => {
        recordEndEvent(
          agent,
          tab,
          formatReturnPayload(agent, _function, result),
        );
      },
      recordThrow: (tab, _function, error) => {
        recordEndEvent(agent, tab, formatThrowPayload(agent, _function, error));
      },
      recordAwait: (tab, promise) => {
        recordBeforeEvent(agent, tab, formatAwaitPayload(agent, promise));
      },
      recordResolve: (tab, result) => {
        recordAfterEvent(agent, tab, formatResolvePayload(agent, result));
      },
      recordReject: (tab, error) => {
        recordAfterEvent(agent, tab, formatRejectPayload(agent, error));
      },
      recordYield: (tab, iterator) => {
        recordBeforeEvent(agent, tab, formatYieldPayload(agent, iterator));
      },
    };
    assert(
      defineGlobal(apply_hook_variable, runtime),
      "global apply hook variable already defined",
      InternalAppmapError,
    );
    return [
      "getFreshTab",
      "recordApply",
      "recordReturn",
      "recordThrow",
      "recordAwait",
      "recordResolve",
      "recordReject",
      "recordYield",
    ].map((key) => ({
      object: runtime,
      key,
      value: noop,
    }));
  }
};
