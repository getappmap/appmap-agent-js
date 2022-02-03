
export default (dependencies) => {
  const {
    recorder: { createRecorder, startTrack, closeTrack},
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
