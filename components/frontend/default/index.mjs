import Session from "./session.mjs";
import Recording from "./recording.mjs";

export default (dependencies) => {
  const {
    uuid: { getUUID },
    instrumentation: {
      createInstrumentation,
      instrument,
      getInstrumentationIdentifier,
    },
  } = dependencies;
  const {
    createSession,
    initializeSession,
    terminateSession,
    registerFileSession,
    startTrackSession,
    stopTrackSession,
  } = Session(dependencies);
  const { createRecording, ...RecordingLibrary } = Recording(dependencies);
  return {
    createFrontend: (configuration) => ({
      session: createSession(configuration),
      recording: createRecording(configuration),
      instrumentation: createInstrumentation(configuration),
    }),
    initializeFrontend: ({ session }) => initializeSession(session),
    terminateFrontend: ({ session }, termination) =>
      terminateSession(session, termination),
    getInstrumentationIdentifier: ({ instrumentation }) =>
      getInstrumentationIdentifier(instrumentation),
    instrument: ({ instrumentation, session }, kind, path, code1) => {
      const { code: code2, file } = instrument(
        instrumentation,
        kind,
        path,
        code1,
      );
      let message = null;
      if (file !== null) {
        message = registerFileSession(session, file);
      }
      return {
        message,
        code: code2,
      };
    },
    createTrack: getUUID,
    startTrack: ({ session }, track, initialization) =>
      startTrackSession(session, track, initialization),
    stopTrack: ({ session }, track, termination) =>
      stopTrackSession(session, track, termination),
    ...RecordingLibrary,
  };
};
