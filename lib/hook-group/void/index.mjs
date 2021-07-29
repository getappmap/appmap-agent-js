export default (dependencies) => {
  const {
    assert: { assert },
  } = dependencies;
  return {
    hookGroupAsync: async (promise, client, frontend, { hooks: { group } }) => {
      assert(!group, "expected configuration to disable group hook");
    },
  };
};
