export default (dependencies) => {
  return {
    createInstrumentation: ({ "hidden-identifier": identifier }) => {
      return { identifier };
    },
    getInstrumentationIdentifier: ({ identifier }) => identifier,
    instrument: ({}, kind, path, code) => ({
      module: { kind, path, code, children: [] },
      code,
    }),
  };
};
