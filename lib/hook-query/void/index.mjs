export default (dependencies) => {
  const {
    assert: { assert },
    util: { noop },
  } = dependencies;
  return {
    hookQuery: (client, frontend, { hooks: { mysql, pg, sqlite3 } }) => {
      assert(
        !mysql && !pg && !sqlite3,
        "expected configuration to disable query hooks (mysql && pg && sqlite3)",
      );
    },
    unhookQuery: noop,
  };
};
