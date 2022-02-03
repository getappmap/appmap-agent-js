export default (dependencies) => {
  const {
    util: { noop },
    expect: { expect },
  } = dependencies;
  return {
    hook: (agent, { ordering }) => {
      expect(
        ordering !== "causal",
        "expected configuration to disable group re-ordering",
      );
    },
    unhook: noop,
  };
};
