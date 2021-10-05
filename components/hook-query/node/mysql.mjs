import { createRequire } from "module";

const { apply } = Reflect;

export default (dependencies) => {
  const {
    util: { assignProperty },
    frontend: {
      getSerializationEmptyValue,
      incrementEventCounter,
      recordBeginBundle,
      recordEndBundle,
      recordBeforeQuery,
      recordAfterQuery,
    },
    emitter: { sendEmitter },
  } = dependencies;
  return {
    unhookMysql: (backup) => {
      backup.forEach(assignProperty);
    },
    hookMysql: (
      emitter,
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
        const index1 = incrementEventCounter(frontend);
        const index2 = incrementEventCounter(frontend);
        sendEmitter(emitter, recordBeginBundle(frontend, index1, null));
        sendEmitter(
          emitter,
          recordBeforeQuery(frontend, index2, {
            database: "mysql",
            version: null,
            sql,
            parameters: values,
          }),
        );
        query._callback = (error, result, fields) => {
          sendEmitter(
            emitter,
            recordAfterQuery(frontend, index2, { error: error || empty }),
          );
          callback(error, result, fields);
          sendEmitter(emitter, recordEndBundle(frontend, index1, null));
        };
        return apply(original, this, [query]);
      };
      return [{ object: prototype, key: "query", value: original }];
    },
  };
};
