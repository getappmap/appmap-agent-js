const { entries: toEntries, fromEntries } = Object;

export default (dependencies) => {
  const {
    "source-outer": { extractSourceMap },
    frontend: {
      createFrontend,
      instrument,
      startTrack,
      stopTrack,
      getInstrumentationIdentifier,
      getSerializationEmptyValue,
      incrementEventCounter,
      recordBeginBundle,
      recordEndBundle,
      recordBeginApply,
      recordEndApply,
      recordBeginResponse,
      recordEndResponse,
      recordBeforeJump,
      recordAfterJump,
      recordBeforeRequest,
      recordAfterRequest,
      recordBeforeQuery,
      recordAfterQuery,
    },
    emitter: {
      openEmitter,
      closeEmitter,
      sendEmitter,
      requestRemoteEmitterAsync,
      takeLocalEmitterTrace,
    },
  } = dependencies;
  const generateRecordIncrement =
    (record) =>
    ({ frontend, emitter }, data) => {
      const index = incrementEventCounter(frontend);
      sendEmitter(emitter, record(frontend, index, data));
      return index;
    };
  const generateRecord =
    (record) =>
    ({ frontend, emitter }, index, data) => {
      sendEmitter(emitter, record(frontend, index, data));
    };
  const generateMapEntry =
    (transform) =>
    ([key, value]) =>
      [key, transform(value)];
  return {
    openAgent: (configuration) => ({
      emitter: openEmitter(configuration),
      frontend: createFrontend(configuration),
    }),
    closeAgent: ({ emitter }) => {
      closeEmitter(emitter);
    },
    getInstrumentationIdentifier: ({ frontend }) =>
      getInstrumentationIdentifier(frontend),
    getSerializationEmptyValue: ({ frontend }) =>
      getSerializationEmptyValue(frontend),
    instrument: ({ frontend, emitter }, file) => {
      const { messages, content: instrumented_content } = instrument(
        frontend,
        file,
        extractSourceMap(file),
      );
      for (const message of messages) {
        sendEmitter(emitter, message);
      }
      return instrumented_content;
    },
    takeLocalAgentTrace: ({ emitter }, key) =>
      takeLocalEmitterTrace(emitter, key),
    /* c8 ignore start */
    requestRemoteAgentAsync: ({ emitter }, method, path, body) =>
      requestRemoteEmitterAsync(emitter, method, path, body),
    /* c8 ignore stop */
    startTrack: ({ emitter, frontend }, key, initialization) => {
      sendEmitter(emitter, startTrack(frontend, key, initialization));
    },
    stopTrack: ({ emitter, frontend }, key, termination) => {
      sendEmitter(emitter, stopTrack(frontend, key, termination));
    },
    ...fromEntries(
      toEntries({
        recordBeginBundle,
        recordBeginApply,
        recordBeginResponse,
        recordBeforeJump,
        recordBeforeRequest,
        recordBeforeQuery,
      }).map(generateMapEntry(generateRecordIncrement)),
    ),
    ...fromEntries(
      toEntries({
        recordEndBundle,
        recordEndApply,
        recordEndResponse,
        recordAfterJump,
        recordAfterRequest,
        recordAfterQuery,
      }).map(generateMapEntry(generateRecord)),
    ),
    amendBeginResponse: generateRecord(recordBeginResponse),
  };
};
