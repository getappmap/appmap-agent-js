import { createRequire } from "module";

const { apply } = Reflect;

export default (dependencies) => {
  const {
    util: { assignProperty },
    frontend: {
      getSerializationEmptyValue,
      incrementEventCounter,
      recordBeforeQuery,
      recordAfterQuery,
    },
    client: { sendClient },
  } = dependencies;
  return {
    unhookMysql: (backup) => {
      backup.forEach(assignProperty);
    },
    hookMysql: (
      client,
      frontend,
      { repository: { directory }, hooks: { mysql } },
    ) => {
      if (!mysql) {
        return [];
      }
      const empty = getSerializationEmptyValue(frontend);
      const require = createRequire(`${directory}/dummy.js`);
      const Mysql = require("mysql");
      const { createConnection, createQuery } = Mysql;
      const { __proto__: prototype } = createConnection({});
      const { query: original } = prototype;
      prototype.query = function query(sql, values, callback) {
        const query = createQuery(sql, values, callback);
        ({ sql, values, _callback: callback } = { values: [], ...query });
        const index = incrementEventCounter(frontend);
        sendClient(
          client,
          recordBeforeQuery(frontend, index, {
            database: "mysql",
            version: null,
            sql,
            parameters: values,
          }),
        );
        query._callback = (error, result, fields) => {
          sendClient(
            client,
            recordAfterQuery(frontend, index, { error: error || empty }),
          );
          callback(error, result, fields);
        };
        return apply(original, this, [query]);
      };
      return [{ object: prototype, key: "query", value: original }];
    },
  };
};
