export default (dependencies) => {
  const {
    assert: { assert },
    util: { noop },
  } = dependencies;
  return {
    transformSourceDefault: (content, context, transformSource) =>
      transformSource(content, context, transformSource),
    hookModule: (client, frontend, { hooks: { esm, cjs } }) => {
      assert(
        !esm && !cjs,
        "expected configuration to disable module hooks (cjs && esm)",
      );
    },
    unhookModule: noop,
  };
};
