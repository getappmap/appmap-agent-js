export default (dependencies) => {
  const {
    assert: { assert },
  } = dependencies;
  return {
    transformSourceDefault: (content, context, transformSource) =>
      transformSource(content, context, transformSource),
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
