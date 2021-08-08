export default (dependencies) => {
  const {
    util: { noop },
    expect: { expect },
  } = dependencies;
  return {
    hookGroup: (client, frontend, { hooks: { group } }) => {
      expect(!group, "expected configuration to disable group hook");
    },
    unhookGroup: noop,
  };
};
