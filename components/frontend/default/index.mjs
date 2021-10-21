import Protocol from "./protocol.mjs";
import Recording from "./recording.mjs";

export default (dependencies) => {
  const {
    instrumentation: {
      createInstrumentation,
      instrument,
      getInstrumentationIdentifier,
      extractInstrumentationSourceMapURL,
    },
  } = dependencies;
  const { registerSourceProtocol, startTrackProtocol, stopTrackProtocol } =
    Protocol(dependencies);
  const { createRecording, ...RecordingLibrary } = Recording(dependencies);
  return {
    createFrontend: (configuration) => ({
      recording: createRecording(configuration),
      instrumentation: createInstrumentation(configuration),
    }),
    extractSourceMapURL: extractInstrumentationSourceMapURL,
    getInstrumentationIdentifier: ({ instrumentation }) =>
      getInstrumentationIdentifier(instrumentation),
    instrument: (
      { instrumentation, session },
      script_file,
      source_map_file,
    ) => {
      const { url, content, sources } = instrument(
        instrumentation,
        script_file,
        source_map_file,
      );
      return {
        url,
        content,
        messages: sources.map(registerSourceProtocol),
      };
    },
    startTrack: ({}, track, initialization) =>
      startTrackProtocol(track, initialization),
    stopTrack: ({}, track, termination) =>
      stopTrackProtocol(track, termination),
    ...RecordingLibrary,
  };
};
