import Payload from "./payload.mjs";

export default (dependencies) => {
  const {
    util: { createCounter, incrementCounter },
    instrumentation: {
      createInstrumentation,
      instrument,
      getInstrumentationIdentifier,
    },
    serialization: { createSerialization, getSerializationEmptyValue },
  } = dependencies;
  const FormatPayloadLibrary = Payload(dependencies);
  const toSourceMessage = (source) => ({
    type: "source",
    ...source,
  });
  const generateFormatAmend =
    (site) =>
    ({}, tab, payload) => ({
      type: "amend",
      site,
      tab,
      payload,
    });
  const generateFormatEvent =
    (site) =>
    ({}, tab, group, time, payload) => ({
      type: "event",
      site,
      tab,
      time,
      group,
      payload,
    });
  return {
    createFrontend: (configuration) => ({
      counter: createCounter(0),
      serialization: createSerialization(configuration),
      instrumentation: createInstrumentation(configuration),
    }),
    getFreshTab: ({ counter }) => incrementCounter(counter),
    getSerializationEmptyValue: ({ serialization }) =>
      getSerializationEmptyValue(serialization),
    getInstrumentationIdentifier: ({ instrumentation }) =>
      getInstrumentationIdentifier(instrumentation),
    instrument: ({ instrumentation }, script_file, source_map_file) => {
      const { url, content, sources } = instrument(
        instrumentation,
        script_file,
        source_map_file,
      );
      return {
        url,
        content,
        messages: sources.map(toSourceMessage),
      };
    },
    formatStartTrack: ({}, track, configuration, url) => ({
      type: "start",
      track,
      configuration,
      url,
    }),
    formatStopTrack: ({}, track, status) => ({
      type: "stop",
      track,
      status,
    }),
    formatError: ({}, name, message, stack) => ({
      type: "error",
      name,
      message,
      stack,
    }),
    formatBeginEvent: generateFormatEvent("begin"),
    formatEndEvent: generateFormatEvent("end"),
    formatBeforeEvent: generateFormatEvent("before"),
    formatAfterEvent: generateFormatEvent("after"),
    formatBeginAmend: generateFormatAmend("begin"),
    formatEndAmend: generateFormatAmend("end"),
    formatBeforeAmend: generateFormatAmend("before"),
    formatAfterAmend: generateFormatAmend("after"),
    ...FormatPayloadLibrary,
  };
};
