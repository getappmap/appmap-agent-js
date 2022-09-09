export default (dependencies) => {
  const {
    "recorder-cli": { createRecorder, recordStartTrack },
  } = dependencies;
  return {
    main: (process, configuration) => {
      const recorder = createRecorder(process, configuration);
      if (recorder !== null) {
        recordStartTrack(recorder, "process", {}, null);
      }
    },
  };
};
