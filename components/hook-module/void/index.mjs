export default (dependencies) => {
  const {
    util: { noop },
    expect: { expect },
  } = dependencies;
  return {
    transformSourceDefault: (content, context, transformSource) =>
      transformSource(content, context, transformSource),
    hookModule: (emitter, frontend, { hooks: { esm, cjs } }) => {
      expect(
        !esm && !cjs,
        "expected configuration to disable module hooks (cjs && esm)",
      );
    },
    unhookModule: noop,
  };
};
