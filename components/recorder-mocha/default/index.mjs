export default (dependencies) => {
  const {
    "recorder-cli": { createRecorder, startTrack, stopTrack },
  } = dependencies;
  return {
    createMochaHooks: (process, configuration) => {
      const recorder = createRecorder(process, configuration);
      if (recorder === null) {
        return {};
      } else {
        return {
          beforeEach() {
            startTrack(recorder, "mocha", {
              path: null,
              data: {
                "map-name": this.currentTest.parent.fullTitle(),
              },
            });
          },
          afterEach() {
            stopTrack(recorder, "mocha", { errors: [], status: 0 });
          },
        };
      }
    },
  };
};
