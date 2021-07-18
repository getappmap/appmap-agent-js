export default (dependencies) => {
  return {
    Program: {
      dismantle: ({ body }) => body,
      assemble: ({ type, sourceType }, body) => ({
        type,
        sourceType,
        body,
      }),
    },
  };
};
