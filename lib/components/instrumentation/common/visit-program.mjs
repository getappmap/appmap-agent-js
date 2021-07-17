
export default ({}) => ({
  Program: {
    dismantle: (node) => node.body,
    assemble: ({sourceType}, body) => ({
      type: "Program",
      sourceType,
      body,
    }),
  },
});
