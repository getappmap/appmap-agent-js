export default (dependencies) => {
  const {
    util: { noop },
    expect: { expect },
  } = dependencies;
  return {
    hookGroup: (client, frontend, { ordering }) => {
      expect(
        ordering !== "causal",
        "expected configuration to disable group re-ordering",
      );
    },
    unhookGroup: noop,
  };
};
