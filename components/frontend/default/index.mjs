import Protocol from "./protocol.mjs";
import Recording from "./recording.mjs";

export default (dependencies) => {
  const {
    instrumentation: {
      createInstrumentation,
      instrument,
      getInstrumentationIdentifier,
    },
  } = dependencies;
  const { registerFileProtocol, startTrackProtocol, stopTrackProtocol } =
    Protocol(dependencies);
  const { createRecording, ...RecordingLibrary } = Recording(dependencies);
  return {
    createFrontend: (configuration) => ({
      recording: createRecording(configuration),
      instrumentation: createInstrumentation(configuration),
    }),
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
        message = registerFileProtocol(file);
      }
      return {
        message,
        code: code2,
      };
    },
    startTrack: ({}, track, initialization) =>
      startTrackProtocol(track, initialization),
    stopTrack: ({}, track, termination) =>
      stopTrackProtocol(track, termination),
    ...RecordingLibrary,
  };
};
