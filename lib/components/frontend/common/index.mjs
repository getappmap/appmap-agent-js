import {noop} from "../../../util/index.mjs";
import Recording from "./recording.mjs";
import { createSerializer, serialize, serializeError } from "./serialization.mjs";

/* eslint-disable no-eval */
const global_eval = eval;
/* eslint-enable no-eval */

export const instrument = ({Client, Instrumentation:{instrument}}, {instrumenter, session}, type, path, code) => {
  const {entity, code} = instrument(instrumenter, type, path, code);
  sendSession(Client, session, "register", entity);
  return code;
};

export const linkAsync = (Client, {session}, parent, child, type) => {
  sendSession(Client, session, "link", {parent, child, type});
};

export const startTrack = (Client, {session, counter}, options) => startTrack(
  Client,
  session,
  incrementCounter(counter),
  options
);

export const terminate = ({runtime, session}, reason) => {
  terminateSession(session, reason);
  runtime.recordApplyBeginEvent = noop;
  runtime.recordApplyEndEvent = noop;
};

export const getRecorder = ({recorder}) => recorder;

export const setupRuntime = (Client) => ({runtime}, getCurrentAsync) => {
  runtime.recordBeforeApply = recordBeforeApply(Client)(recorder)(getCurrentAsync);
  runtime.recordAfterApply = recordBeforeApply(Client)(recorder)(getCurrentAsync);
};

export default ({Client, Grouping, Instrumentation, Interpretation}) => {
  const {runScript} = Interpretation;
  const {createInstrumenter, instrument, getInstrumentationIdentifier} = Instrumentation;
  const {initializeRecording, terminateRecording, recordEntity, recordTrack, recordBeforeEvent, recordAfterEvent } = Recording({Client, Grouping});
  const recordBeforeApply = ({recording, serialization}, _function, _this, _arguments) => {
    recordBeforeEvent(
      recording,
      {
        function: _function,
        this: serializeArgument(serialization, _this),
        arguments: _arguments.map((argument) => serializeArgument(serialization, argument)),
      },
    );
  };
  const recordAfterApply = ({recording, serialization}, index, error, result) => {
    recordAfterEvent(
      recording,
      index,
      {
        error: serializeError(serialization, error),
        result: serializeResult(serialization,result),
      }
    );
  };
  const controlTrack = (type) => ({recording}, data) => recordTrack(
    recording,
    {type, data}
  );
  return {
    initializeFrontend: (options) => {
      const recording = initializeRecording(options);
      const serialization = createSerialization(options);
      const instrumentation = createInstrumentation(options);
      const frontend = {
        recording,
        serialization,
        instrumentation,
      };
      const runtime_identifier = getInstrumentationIdentifier(instrumentation);
      runScript(`'use strict'; const ${runtime_identifier} = {empty:null, frontend:null, recordBeginApply:null, recordEndApply:null};`);
      const runtime = global_eval(runtime_identifier);
      runtime.empty = getSerializationEmptyValue(serialization);
      runtime.frontend = frontend;
      runtime.recordBeforeApply = recordBeforeApply;
      runtime.recordAfterApply = recordAfterApply;
      return frontend;
    },
    terminateFrontend: ({recording}, reason) => terminateRecording(recording, reason),
    instrument: ({instrumentation, recording}, type, path, code) => {
      const {code, entity} = instrument(instrumentation, type, path, code);
      if (entity !== null) {
        recordEntity(recording, entity);
      }
      return code;
    },
    startTrack: controlTrack("start"),
    stopTrack: controlTrack("stop"),
    pauseTrack: controlTrack("pause"),
    playTrack: controlTrack("play"),
    recordBeforeQuery: ({recording}, database, sql, parameters) => recordBeforeEvent(
      recording,
      {
        database,
        sql,
        parameters
      },
    ),
    recordAfterQuery: ({recording}, index) => recordAfterEvent(
      recording,
      index,
      null
    ),
    recordingBeforeRequest: ({recording}, method, url, headers) => recordBefore(
      recording,
      {
        type: "request",
        method,
        url,
        headers,
      },
    ),
    recordingAfterRequest: ({recording}, index, status, message, headers) => recordAfter(
      recording,
      index,
      {
        type: "request",
        status,
        message,
        headers,
      },
    ),
    recordBeforeResponse: ({recording}, status, message, headers) => recordBefore(
      recording,
      {
        type: "response",
        status,
        message,
        headers,
      },
    ),
    recordAfterResponse = ({recording}, index, method, url, headers) => recordAfter(
      recording,
      index,
      {
        type: "response",
        method,
        url,
        headers,
      },
    ),
  };
};
