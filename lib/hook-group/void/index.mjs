export default (dependencies) => {
  const {
    assert: { assert },
  } = dependencies;
  return {
    hookGroupAsync: async (client, state, { hooks: { group } }) => {
      assert(group === false, "expected configuration to disable group hook");
    },
  };
};
