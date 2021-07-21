import Recording from "./recording.mjs";
import Track from "./track.mjs";
import Messaging from "./messaging.mjs";
import Serialization from "./serialization.mjs";

const getMessaging = ({ messaging }) => messaging;
const getInstrumentation = ({ instrumentation }) => instrumentation;
const getSerialization = ({ serialization }) => serialization;

export default (dependencies) => {
  const {
    util: { compose, createCounter, incrementCounter },
    uuid: { getUUID },
    instrumentation: {
      createInstrumentation,
      instrument,
      getInstrumentationIdentifier,
    },
  } = dependencies;
  const { createSerialization, serialize, getSerializationEmptyValue } =
    Serialization(dependencies);
  const {
    initializeMessaging,
    terminateMessaging,
    messageEntity,
    asyncMessagingTermination,
  } = Messaging(dependencies);
  const { initializeTrack, terminateTrack, enableTrack, disableTrack } =
    Track(dependencies);
  const { initializeRecording, recordBefore, recordAfter, terminateRecording } =
    Recording(dependencies);
  const generateRecordBefore =
    (serialize) =>
    ({ messaging, recording, serialization }, ...rest) =>
      recordBefore(messaging, recording, serialize(serialization, ...rest));
  const generateRecordAfter =
    (serialize) =>
    ({ messaging, recording, serialization }, index, ...rest) => {
      recordAfter(
        messaging,
        recording,
        index,
        serialize(serialization, ...rest),
      );
    };
  return {
    initializeFrontend: (options) => ({
      counter: createCounter(),
      messaging: initializeMessaging(getUUID(), options),
      recording: initializeRecording(options),
      serialization: createSerialization(options),
      instrumentation: createInstrumentation(options),
    }),
    terminateFrontend: ({ messaging, recording }) => {
      terminateMessaging(messaging);
    },
    asyncFrontendTermination: async ({ messaging, recording }) => {
      try {
        await asyncMessagingTermination(messaging);
      } finally {
        terminateRecording(recording);
      }
    },
    getInstrumentationIdentifier: compose(
      getInstrumentation,
      getInstrumentationIdentifier,
    ),
    getSerializationEmptyValue: compose(
      getSerialization,
      getSerializationEmptyValue,
    ),
    instrument: ({ instrumentation, messaging }, type, path, code1) => {
      const { code: code2, entity } = instrument(
        instrumentation,
        type,
        path,
        code1,
      );
      if (entity !== null) {
        messageEntity(messaging, entity);
      }
      return code2;
    },
    initializeTrack: ({ messaging, counter }, options) =>
      initializeTrack(messaging, incrementCounter(counter), options),
    terminateTrack: compose(getMessaging, terminateTrack),
    enableTrack: compose(getMessaging, enableTrack),
    disableTrack: compose(getMessaging, disableTrack),
    recordBeforeApply: generateRecordBefore(
      (serialization, _function, _this, _arguments) => ({
        type: "apply",
        function: _function,
        this: serialize(serialization, _this),
        arguments: _arguments.map((argument) =>
          serialize(serialization, argument),
        ),
      }),
    ),
    recordAfterApply: generateRecordAfter((serialization, error, result) => ({
      type: "apply",
      error: serialize(serialization, error),
      result: serialize(serialization, result),
    })),
    recordBeforeQuery: generateRecordBefore(
      (serialization, database, sql, parameters) => ({
        type: "query",
        database,
        sql,
        parameters,
      }),
    ),
    recordAfterQuery: generateRecordAfter((serialization) => ({
      type: "query",
    })),
    recordBeforeRequest: generateRecordBefore(
      (serialization, method, url, headers) => ({
        type: "request",
        method,
        url,
        headers,
      }),
    ),
    recordAfterRequest: generateRecordAfter(
      (serialization, status, message, headers) => ({
        type: "request",
        status,
        message,
        headers,
      }),
    ),
    recordBeforeResponse: generateRecordBefore(
      (serialization, status, message, headers) => ({
        type: "response",
        status,
        message,
        headers,
      }),
    ),
    recordAfterResponse: generateRecordAfter(
      (serialization, method, url, headers) => ({
        type: "response",
        method,
        url,
        headers,
      }),
    ),
  };
};
