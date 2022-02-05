export default (dependencies) => {
  const {
    "recorder-cli": { createRecorder, startTrack },
  } = dependencies;
  return {
    main: (process, configuration) => {
      const recorder = createRecorder(process, configuration);
      if (recorder !== null) {
        startTrack(recorder, "process", { path: null, data: {} });
      }
    },
  };
};
