export default (dependencies) => {
  const {
    util: { noop },
    expect: { expect },
  } = dependencies;
  return {
    hookQuery: (emitter, frontend, { hooks: { mysql, pg, sqlite3 } }) => {
      expect(
        !mysql && !pg && !sqlite3,
        "expected configuration to disable query hooks (mysql && pg && sqlite3)",
      );
    },
    unhookQuery: noop,
  };
};
