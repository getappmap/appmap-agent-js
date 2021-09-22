const STORED_TAG = "stored";
const SERVED_TAG = "served";

export default (dependencies) => {
  const {
    configuration: { extendConfiguration },
    util: { assert, mapMaybe, getBasename },
    trace: { compileTrace },
  } = dependencies;
  /* c8 ignore start */
  const getName = ({ name }) => name;
  /* c8 ignore stop */
  const generateCreateTrack = (tag) => (initialization) => ({
    tag,
    initialization,
    events: [],
  });
  const generateIsTrack =
    (tag1) =>
    ({ tag: tag2 }) =>
      tag1 === tag2;
  const compileTrack = (
    { events, initialization: { options, path } },
    { files, configuration },
    termination,
  ) => {
    configuration = extendConfiguration(configuration, options, path);
    return {
      configuration,
      trace: compileTrace(configuration, files, events, termination),
    };
  };
  return {
    createStoredTrack: generateCreateTrack(STORED_TAG),
    createServedTrack: generateCreateTrack(SERVED_TAG),
    isStoredTrack: generateIsTrack(STORED_TAG),
    isServedTrack: generateIsTrack(SERVED_TAG),
    addTrackEvent: ({ events }, event) => {
      events.push(event);
    },
    serveTrack: (track, options, termination) => {
      assert(track.tag === SERVED_TAG, "expected served track");
      const { trace } = compileTrack(track, options, termination);
      return trace;
    },
    storeTrack: (track, options, termination) => {
      assert(track.tag === STORED_TAG, "expected stored track");
      const {
        configuration: {
          name,
          app,
          main,
          repository: { package: _package },
          output: { directory, basename, extension },
        },
        trace,
      } = compileTrack(track, options, termination);
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
