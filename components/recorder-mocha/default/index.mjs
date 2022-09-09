export default (dependencies) => {
  const {
    "recorder-cli": { createRecorder, recordStartTrack, recordStopTrack },
  } = dependencies;
  return {
    createMochaHooks: (process, configuration) => {
      const recorder = createRecorder(process, configuration);
      if (recorder === null) {
        return {};
      } else {
        return {
          beforeEach() {
            recordStartTrack(
              recorder,
              "mocha",
              {
                "map-name": this.currentTest.parent.fullTitle(),
              },
              null,
            );
          },
          afterEach() {
            recordStopTrack(recorder, "mocha", 0);
          },
        };
      }
    },
  };
};
