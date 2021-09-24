export default (dependencies) => {
  const {
    configuration: { extendConfiguration },
    util: { mapMaybe, getBasename },
    trace: { compileTrace },
  } = dependencies;
  /* c8 ignore start */
  const getName = ({ name }) => name;
  /* c8 ignore stop */
  return {
    createTrack: (configuration, { path, data }) => ({
      configuration: extendConfiguration(configuration, data, path),
      events: [],
    }),
    addTrackEvent: ({ events }, event) => {
      events.push(event);
    },
    compileTrack: ({ configuration, events }, files, termination) => {
      const {
        name,
        app,
        main,
        repository: { package: _package },
        output: { target, directory, basename, extension },
      } = configuration;
      const trace = compileTrace(configuration, files, events, termination);
      if (target === "http") {
        return { path: null, data: trace };
      }
      return {
        path: `${directory}/${
          basename ||
          name ||
          mapMaybe(main, getBasename) ||
          app ||
          mapMaybe(_package, getName) ||
          "anonymous"
        }${extension}`,
        data: trace,
      };
    },
  };
};
