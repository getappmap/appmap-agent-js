const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { now } = await import(`../../time/index.mjs${__search}`);
const { getCurrentGroup } = await import(`../../group/index.mjs${__search}`);
const {
  createFrontend,
  getFreshTab: getFrontendFreshTab,
  instrument: instrumentFrontend,
  getSerializationEmptyValue: getFrontendSerializationEmptyValue,
  formatError,
  formatStartTrack,
  formatStopTrack,
  formatGroup,
  formatBeginEvent,
  formatEndEvent,
  formatBeforeEvent,
  formatAfterEvent,
  formatBeginAmend,
  formatEndAmend,
  formatBeforeAmend,
  formatAfterAmend,
  getJumpPayload: getFrontendJumpPayload,
  getBundlePayload: getFrontendBundlePayload,
  formatApplyPayload: formatFrontendApplyPayload,
  formatReturnPayload: formatFrontendReturnPayload,
  formatThrowPayload: formatFrontendThrowPayload,
  formatAwaitPayload: formatFrontendAwaitPayload,
  formatResolvePayload: formatFrontendResolvePayload,
  formatRejectPayload: formatFrontendRejectPayload,
  formatYieldPayload: formatFrontendYieldPayload,
  getResumePayload: getFrontendResumePayload,
  formatRequestPayload: formatFrontendRequestPayload,
  formatResponsePayload: formatFrontendResponsePayload,
  formatQueryPayload: formatFrontendQueryPayload,
  getAnswerPayload: getFrontendAnswerPayload,
  formatGroupPayload: formatFrontendGroupPayload,
  formatUngroupPayload: formatFrontendUngroupPayload,
} = await import(`../../frontend/index.mjs${__search}`);
const {
  openEmitter,
  closeEmitter,
  sendEmitter,
  requestRemoteEmitterAsync,
  takeLocalEmitterTrace,
} = await import(`../../emitter/index.mjs${__search}`);
const { loadSourceMap } = await import(`./source-map.mjs${__search}`);

export const openAgent = (configuration) => ({
  emitter: openEmitter(configuration),
  frontend: createFrontend(configuration),
});

export const closeAgent = ({ emitter }) => {
  closeEmitter(emitter);
};

export const getFreshTab = ({ frontend }) => getFrontendFreshTab(frontend);

export const getSerializationEmptyValue = ({ frontend }) =>
  getFrontendSerializationEmptyValue(frontend);

export const instrument = ({ frontend, emitter }, file) => {
  const { messages, content } = instrumentFrontend(
    frontend,
    file,
    loadSourceMap(file),
  );
  for (const message of messages) {
    sendEmitter(emitter, message);
  }
  return content;
};

export const takeLocalAgentTrace = ({ emitter }, key) =>
  takeLocalEmitterTrace(emitter, key);

/* c8 ignore start */
export const requestRemoteAgentAsync = ({ emitter }, method, path, body) =>
  requestRemoteEmitterAsync(emitter, method, path, body);
/* c8 ignore stop */

export const recordGroup = ({ emitter, frontend }, child, description) => {
  sendEmitter(
    emitter,
    formatGroup(frontend, getCurrentGroup(), child, description),
  );
};

const generateRecord =
  (format) =>
  ({ emitter, frontend }, extra1, extra2, extra3) => {
    sendEmitter(emitter, format(frontend, extra1, extra2, extra3));
  };

export const recordBeginAmend = generateRecord(formatBeginAmend);
export const recordEndAmend = generateRecord(formatEndAmend);
export const recordBeforeAmend = generateRecord(formatBeforeAmend);
export const recordAfterAmend = generateRecord(formatAfterAmend);
export const recordStartTrack = generateRecord(formatStartTrack);
export const recordStopTrack = generateRecord(formatStopTrack);
export const recordError = generateRecord(formatError);

const generateRecordEvent =
  (formatEvent) =>
  ({ frontend, emitter }, tag, payload) => {
    sendEmitter(
      emitter,
      formatEvent(frontend, tag, getCurrentGroup(), now(), payload),
    );
  };

export const recordBeginEvent = generateRecordEvent(formatBeginEvent);
export const recordEndEvent = generateRecordEvent(formatEndEvent);
export const recordBeforeEvent = generateRecordEvent(formatBeforeEvent);
export const recordAfterEvent = generateRecordEvent(formatAfterEvent);

const generateFormatPayload =
  (formatPayload) =>
  // We avoid using rest and spread syntax here for two reasons:
  //   1) Spread use Array.prototype[@Symbol.iterator] which is unsafe
  //      because it can be overwritten by the user
  //   2) This is hot code so avoiding creating an array may have some
  //      performance gain.
  ({ frontend }, extra1, extra2, extra3, extra4, extra5, extra6, extra7) =>
    formatPayload(
      frontend,
      extra1,
      extra2,
      extra3,
      extra4,
      extra5,
      extra6,
      extra7,
    );

export const getJumpPayload = generateFormatPayload(getFrontendJumpPayload);
export const getBundlePayload = generateFormatPayload(getFrontendBundlePayload);
export const formatApplyPayload = generateFormatPayload(
  formatFrontendApplyPayload,
);
export const formatReturnPayload = generateFormatPayload(
  formatFrontendReturnPayload,
);
export const formatThrowPayload = generateFormatPayload(
  formatFrontendThrowPayload,
);
export const formatAwaitPayload = generateFormatPayload(
  formatFrontendAwaitPayload,
);
export const formatResolvePayload = generateFormatPayload(
  formatFrontendResolvePayload,
);
export const formatRejectPayload = generateFormatPayload(
  formatFrontendRejectPayload,
);
export const formatYieldPayload = generateFormatPayload(
  formatFrontendYieldPayload,
);
export const getResumePayload = generateFormatPayload(getFrontendResumePayload);
export const formatRequestPayload = generateFormatPayload(
  formatFrontendRequestPayload,
);
export const formatResponsePayload = generateFormatPayload(
  formatFrontendResponsePayload,
);
export const formatQueryPayload = generateFormatPayload(
  formatFrontendQueryPayload,
);
export const getAnswerPayload = generateFormatPayload(getFrontendAnswerPayload);
export const formatGroupPayload = generateFormatPayload(
  formatFrontendGroupPayload,
);
export const formatUngroupPayload = generateFormatPayload(
  formatFrontendUngroupPayload,
);
