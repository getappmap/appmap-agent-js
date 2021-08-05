// import { createRequire } from "module";
import Mysql from "mysql";

const { apply } = Reflect;

export default (dependencies) => {
  const {
    frontend: { incrementEventCounter, recordBeforeQuery, recordAfterQuery },
    client: { sendClient },
  } = dependencies;
  return {
    hookMysql: (
      client,
      frontend,
      { repository: { directory }, hooks: { mysql } },
    ) => {
      if (!mysql) {
        return { prototype: null, query: null };
      }
      // const require = createRequire(directory);
      // const Mysql = require("mysql");
      // console.log(Mysql);
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
          sendClient(client, recordAfterQuery(frontend, index, null));
          callback(error, result, fields);
        };
        return apply(original, this, [query]);
      };
      return {
        prototype,
        query: original,
      };
    },
    unhookMysql: ({ prototype, query }) => {
      if (prototype !== null) {
        prototype.query = query;
      }
    },
  };
};
