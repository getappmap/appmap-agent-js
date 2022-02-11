import Require from "./require.mjs";

const { apply } = Reflect;

export default (dependencies) => {
  const {
    util: { assignProperty },
    agent: {
      getSerializationEmptyValue,
      recordBeginBundle,
      recordEndBundle,
      recordBeforeQuery,
      recordAfterQuery,
    },
  } = dependencies;
  const { requireMaybe } = Require(dependencies);
  return {
    unhook: (backup) => {
      backup.forEach(assignProperty);
    },
    hook: (agent, { repository: { directory }, hooks: { mysql } }) => {
      const Mysql = requireMaybe(mysql, directory, "mysql");
      if (Mysql === null) {
        return [];
      }
      const empty = getSerializationEmptyValue(agent);
      const { createConnection, createQuery } = Mysql;
      const { __proto__: prototype } = createConnection({});
      const { query: original } = prototype;
      prototype.query = function query(sql, values, callback) {
        const query = createQuery(sql, values, callback);
        ({ sql, values, _callback: callback } = { values: [], ...query });
        const index1 = recordBeginBundle(agent, null);
        const index2 = recordBeforeQuery(agent, {
          database: "mysql",
          version: null,
          sql,
          parameters: values,
        });
        query._callback = (error, result, fields) => {
          recordAfterQuery(agent, index2, { error: error || empty });
          callback(error, result, fields);
          recordEndBundle(agent, index1, null);
        };
        return apply(original, this, [query]);
      };
      return [{ object: prototype, key: "query", value: original }];
    },
  };
};
