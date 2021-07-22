import Session from "./session.mjs";
import Message from "./message.mjs";
import Recording from "./recording.mjs";
import Track from "./track.mjs";

// const getSession = ({ session }) => session;
// const getInstrumentation = ({ instrumentation }) => instrumentation;
// const getSerialization = ({ serialization }) => serialization;

export default (dependencies) => {
  const {
    util: { createCounter, incrementCounter },
    uuid: { getUUID },
    instrumentation: {
      createInstrumentation,
      instrument,
      getInstrumentationIdentifier,
    },
  } = dependencies;
  const { createSession, initializeSession, terminateSession } =
    Session(dependencies);
  const { messageModule, messageGroup } = Message(dependencies);
  const { createTrack, controlTrack } = Track(dependencies);
  const { createRecording, ...RecordingLibrary } = Recording(dependencies);
  return {
    createState: (options) => ({
      track_counter: createCounter(),
      recording: createRecording(options),
      instrumentation: createInstrumentation(options),
      session: createSession(getUUID(), options),
    }),
    initializeState: ({ session }) => initializeSession(session),
    terminateState: ({ session }, reason) =>
      terminateSession(session, reason),
    createTrack: ({ track_counter }, options) =>
      createTrack(incrementCounter(track_counter), options),
    declareGroup: ({ session }, group) => messageGroup(session, group),
    getInstrumentationIdentifier: ({ instrumentation }) =>
      getInstrumentationIdentifier(instrumentation),
    instrument: ({ instrumentation, session }, kind, path, code1) => {
      const { code: code2, entity } = instrument(
        instrumentation,
        kind,
        path,
        code1,
      );
      let message = null;
      if (entity !== null) {
        message = messageModule(session, entity);
      }
      return {
        message,
        code: code2,
      };
    },
    controlTrack: ({session}, track, action) => controlTrack(session, track, action),
    ...RecordingLibrary,
  };
};
