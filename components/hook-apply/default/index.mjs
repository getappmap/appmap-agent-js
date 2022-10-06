const {
  URL,
  Reflect: { defineProperty },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { assert, noop, assignProperty, hasOwnProperty } = await import(
  `../../util/index.mjs${__search}`
);
const {
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
  getResumePayload,
} = await import(`../../agent/index.mjs${__search}`);

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

export const hook = (agent, { hooks: { apply: apply_hook_variable } }) => {
  if (apply_hook_variable === null) {
    return [];
  } else {
    assert(
      !hasOwnProperty(globalThis, apply_hook_variable),
      "global apply hook variable already defined",
    );
    const resume_payload = getResumePayload(agent);
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
      recordResume: (tab) => {
        recordAfterEvent(agent, tab, resume_payload);
      },
    };
    defineProperty(globalThis, apply_hook_variable, {
      __proto__: null,
      writable: false,
      enumerable: false,
      configurable: true,
      value: runtime,
    });
    return [
      "getFreshTab",
      "recordApply",
      "recordReturn",
      "recordThrow",
      "recordAwait",
      "recordResolve",
      "recordReject",
      "recordYield",
      "recordResume",
    ].map((key) => ({
      object: runtime,
      key,
      value: noop,
    }));
  }
};
