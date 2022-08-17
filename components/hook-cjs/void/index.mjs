export default (dependencies) => {
  const {
    util: { noop },
    expect: { expect },
  } = dependencies;
  return {
    hook: (agent, { hooks: { cjs } }) => {
      expect(!cjs, "expected configuration to disable cjs module hook");
    },
    unhook: noop,
  };
};
