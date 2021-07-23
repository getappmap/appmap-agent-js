export default (dependencies) => {
  return {
    createInstrumentation: (options) => {
      const {runtime} = {
        rutime: "$",
        ... options,
      }
      return {runtime};
    },
    getInstrumentationIdentifier: ({runtime}) => runtime,
    instrument: ({}, kind, path, code) => ({
      module: { kind, path, code, children: [] },
      code,
    }),
  };
};
