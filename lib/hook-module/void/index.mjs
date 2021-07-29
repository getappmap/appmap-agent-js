export default (dependencies) => {
  const {
    assert: { assert, assertDeadcode },
  } = dependencies;
  return {
    transformSourceDefault: assertDeadcode(
      "the default transform source function should never be called, got: [%o, %o, %o]",
    ),
    hookModuleAsync: async (
      promise,
      client,
      state,
      { hooks: { esm, cjs } },
    ) => {
      assert(
        !esm && !cjs,
        "expected configuration to disable module hooks (cjs && esm)",
      );
    },
  };
};
