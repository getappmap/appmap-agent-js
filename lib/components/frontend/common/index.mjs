import Recording from "./recording.mjs";
import Track from "./track.mjs";
import Messaging from "./messaging.mjs";
import Serialization from "./serialization";

/* eslint-disable no-eval */
const global_eval = eval;
/* eslint-enable no-eval */

const getMessaging = ({messaging}) => messaging;
const getInstrumentation = ({instrumentation}) => instrumentation;
const getSerialization = ({serialization}) => serialization;

export default (dependencies) => {
  const {util:{compose}, instrumentation:{createInstrumentation, instrument, getInstrumentationIdentifier}} = dependencies;
  const {createSerialization, serializaArgument, serializaError, serializeResult} = Serialization(dependencies);
  const {openMessaging, closeMessaging, messageEntity, messageGroup} = Messaging(dependencies);
  const {openTrack, closeTrack, enableTrack, disableTrack} = Track(dependencies);
  const {createRecording, recordBefore, recordAfter} = Recording(dependencies);
  const makeRecordBefore = (serialize) => ({messaging, recording, serialization}, group, ... rest) => recordBefore(
    messaging,
    recording,
    group,
    serialize(serialization, ... rest),
  );
  const makeRecordAfter = (serialize) => ({messaging, recording, serialization}, group, index, ... rest) => {
    recordAfter(
      messaging,
      recording,
      group,
      index,
      serialize(serialization, ...rest),
    );
  };
  return {
    openFrontend: (options) => ({
      messaging: openMessaging(options),
      track: createCounter(),
      serialization: createSerialization(options),
      instrumentation: createInstrumentation(options),
    }),
    closeFrontend: compose(getMessaging, closeMessaging),
    awaitFrontend: compose(getMessaging, awaitMessaging),
    getInstrumentationIdentifier: compose(getInstrumentation, getInstrumentationIdentifier),
    getSerializationEmptyValue: compose(getSerialization, getSerializationEmptyValue),
    instrument: ({instrumentation, messaging}, type, path, code) => {
      const {code, entity} = instrument(instrumentation, type, path, code);
      if (entity !== null) {
        messageEntity(messaging, entity);
      }
      return code;
    },
    linkGroup: ({messaging}, info, group, origin) => messageGroup(messaging, {info, group, origin}),
    openTrack: ({messaging, track}, options) => openTrack(messaging, incrementCounter(track), options),
    closeTrack: compose(getSession, closeTrack),
    enableTrack: compose(getSession, enableTrack),
    disableTrack: compose(getSession, disableTrack),
    recordBeforeApply: makeRecordBefore((serialization, _function, _this, _arguments) => ({
      type: "apply",
      function: _function,
      this: serializeArgument(serialization, _this),
      arguments: _arguments.map((argument) => serializeArgument(serialization, argument)),
    })),
    recordAfterApply: makeRecordAfter((serialization, error, result) => ({
      type: "apply",
      error: serializeError(serialization, error),
      result: serializeResult(serialization,result),
    }));
    recordBeforeQuery: makeRecordBefore((serialization, database, sql, parameters) => ({
      type: "query",
      database,
      sql,
      parameters
    })),
    recordAfterQuery: makeRecordAfter((serialization) => ({type:"query"})),
    recordingBeforeRequest: makeRecordBefore((serialization, method, url, headers) => ({
      type: "request",
      method,
      url,
      headers,
    }),
    recordingAfterRequest: makeRecordAfter((serialization, status, message, headers) => ({
      type: "request",
      status,
      message,
      headers,
    }),
    recordBeforeResponse: makeRecordBefore((serialization, status, message, headers) => ({
      type: "response",
      status,
      message,
      headers,
    })),
    recordAfterResponse = makeRecordAfter(serialization, method, url, headers) => ({
      type: "response",
      method,
      url,
      headers,
    }),
  };
};
