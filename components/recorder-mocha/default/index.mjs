const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { createRecorder, recordStartTrack, recordStopTrack } = await import(
  `../../recorder-cli/index.mjs${__search}`
);

export const createMochaHooks = (process, configuration) => {
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
};
