export default (dependencies) => {
  return {
    createInstrumentation: ({ "hidden-identifier": identifier }) => {
      return { identifier };
    },
    getInstrumentationIdentifier: ({ identifier }) => identifier,
    instrument: ({}, type, path, code) => ({ code, file: null }),
  };
};
