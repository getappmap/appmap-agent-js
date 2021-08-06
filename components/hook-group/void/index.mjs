export default (dependencies) => {
  const {
    assert: { assert },
    util: { noop },
  } = dependencies;
  return {
    hookGroup: (client, frontend, { hooks: { group } }) => {
      assert(!group, "expected configuration to disable group hook");
    },
    unhookGroup: noop,
  };
};
