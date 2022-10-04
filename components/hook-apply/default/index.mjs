const { URL, eval: evalGlobal } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { noop, assignProperty } = await import(
  `../../util/index.mjs${__search}`
);
const { runScript } = await import(`../../interpretation/index.mjs${__search}`);
const {
  getFreshTab,
  getSerializationEmptyValue,
  getInstrumentationIdentifier,
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

export const hook = (agent, { hooks: { apply } }) => {
  if (!apply) {
    return [];
  } else {
    const identifier = getInstrumentationIdentifier(agent);
    runScript(
      `
            const ${identifier}_APPLY_ID = 0;
            const ${identifier} = {
              empty: null,
              getFreshTab: null,
              recordApply: null,
              recordReturn: null,
              recordThrow: null,
              recordAwait: null,
              recordResolve: null,
              recordReject: null,
              recordYield: null,
              recordResume: null,
            };
          `,
      "file:///appmap-setup.js",
    );
    const resume_payload = getResumePayload(agent);
    const runtime = evalGlobal(identifier);
    runtime.empty = getSerializationEmptyValue(agent);
    runtime.getFreshTab = () => getFreshTab(agent);
    runtime.recordApply = (tab, _function, _this, _arguments) => {
      recordBeginEvent(
        agent,
        tab,
        formatApplyPayload(agent, _function, _this, _arguments),
      );
    };
    runtime.recordReturn = (tab, _function, result) => {
      recordEndEvent(agent, tab, formatReturnPayload(agent, _function, result));
    };
    runtime.recordThrow = (tab, _function, error) => {
      recordEndEvent(agent, tab, formatThrowPayload(agent, _function, error));
    };
    runtime.recordAwait = (tab, promise) => {
      recordBeforeEvent(agent, tab, formatAwaitPayload(agent, promise));
    };
    runtime.recordResolve = (tab, result) => {
      recordAfterEvent(agent, tab, formatResolvePayload(agent, result));
    };
    runtime.recordReject = (tab, error) => {
      recordAfterEvent(agent, tab, formatRejectPayload(agent, error));
    };
    runtime.recordYield = (tab, iterator) => {
      recordBeforeEvent(agent, tab, formatYieldPayload(agent, iterator));
    };
    runtime.recordResume = (tab) => {
      recordAfterEvent(agent, tab, resume_payload);
    };
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
