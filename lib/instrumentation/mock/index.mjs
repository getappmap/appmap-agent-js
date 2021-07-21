export default (dependencies) => {
  return {
    createInstrumentation: (options) => ({}),
    getInstrumentationIdentifier: ({}) => "$",
    instrument: ({}, kind, path, code) => ({
      entity: { kind, path, code, children: [] },
      code,
    }),
  };
};
