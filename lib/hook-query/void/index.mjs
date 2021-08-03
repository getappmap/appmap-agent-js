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
      frontend,
      { hooks: { mysql, pg, sqlite3 } },
    ) => {
      assert(
        !mysql && !pg && !sqlite3,
        "expected configuration to disable query hooks (mysql && pg && sqlite3)",
      );
    },
  };
};
