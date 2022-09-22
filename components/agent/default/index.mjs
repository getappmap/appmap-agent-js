import SourceMap from "./source-map.mjs";

const {
  Object: { fromEntries, entries: toEntries },
} = globalThis;

export default (dependencies) => {
  const {
    time: { now },
    group: { getCurrentGroup },
    frontend: {
      createFrontend,
      getFreshTab,
      instrument,
      getInstrumentationIdentifier,
      getSerializationEmptyValue,
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
      ...FormatPayloadLibrary
    },
    emitter: {
      openEmitter,
      closeEmitter,
      sendEmitter,
      requestRemoteEmitterAsync,
      takeLocalEmitterTrace,
    },
  } = dependencies;
  const { loadSourceMap } = SourceMap(dependencies);
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
  const generateRecord =
    (format) =>
    ({ emitter, frontend }, extra1, extra2, extra3) => {
      sendEmitter(emitter, format(frontend, extra1, extra2, extra3));
    };
  const generateRecordEvent =
    (formatEvent) =>
    ({ frontend, emitter }, tag, payload) => {
      sendEmitter(
        emitter,
        formatEvent(frontend, tag, getCurrentGroup(), now(), payload),
      );
    };
  return {
    openAgent: (configuration) => ({
      emitter: openEmitter(configuration),
      frontend: createFrontend(configuration),
    }),
    closeAgent: ({ emitter }) => {
      closeEmitter(emitter);
    },
    getFreshTab: ({ frontend }) => getFreshTab(frontend),
    getInstrumentationIdentifier: ({ frontend }) =>
      getInstrumentationIdentifier(frontend),
    getSerializationEmptyValue: ({ frontend }) =>
      getSerializationEmptyValue(frontend),
    instrument: ({ frontend, emitter }, file) => {
      const { messages, content } = instrument(
        frontend,
        file,
        loadSourceMap(file),
      );
      for (const message of messages) {
        sendEmitter(emitter, message);
      }
      return content;
    },
    takeLocalAgentTrace: ({ emitter }, key) =>
      takeLocalEmitterTrace(emitter, key),
    /* c8 ignore start */
    requestRemoteAgentAsync: ({ emitter }, method, path, body) =>
      requestRemoteEmitterAsync(emitter, method, path, body),
    /* c8 ignore stop */
    recordGroup: ({ emitter, frontend }, child, description) => {
      sendEmitter(
        emitter,
        formatGroup(frontend, getCurrentGroup(), child, description),
      );
    },
    recordBeginAmend: generateRecord(formatBeginAmend),
    recordEndAmend: generateRecord(formatEndAmend),
    recordBeforeAmend: generateRecord(formatBeforeAmend),
    recordAfterAmend: generateRecord(formatAfterAmend),
    recordStartTrack: generateRecord(formatStartTrack),
    recordStopTrack: generateRecord(formatStopTrack),
    recordError: generateRecord(formatError),
    recordBeginEvent: generateRecordEvent(formatBeginEvent),
    recordEndEvent: generateRecordEvent(formatEndEvent),
    recordBeforeEvent: generateRecordEvent(formatBeforeEvent),
    recordAfterEvent: generateRecordEvent(formatAfterEvent),
    ...fromEntries(
      toEntries(FormatPayloadLibrary).map(([name, formatPayload]) => [
        name,
        generateFormatPayload(formatPayload),
      ]),
    ),
  };
};
