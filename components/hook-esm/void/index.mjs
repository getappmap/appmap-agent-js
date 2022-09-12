export default (dependencies) => {
  const {
    util: { noop },
    expect: { expect },
  } = dependencies;
  return {
    hook: (_agent, { hooks: { esm } }) => {
      expect(!esm, "expected configuration to disable esm module hook");
    },
    unhook: noop,
  };
};
