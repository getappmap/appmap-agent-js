import { createRequire } from "module";

const { apply } = Reflect;

export default (dependencies) => {
  const {
    frontend: { incrementEventCounter, recordBeforeQuery, recordAfterQuery },
    client: { sendClient },
  } = dependencies;
  const hook = (Mysql, client, frontend) => {
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
  };
  return {
    hookMysql: (
      client,
      frontend,
      { repository: { directory }, hooks: { mysql } },
    ) => {
      if (!mysql) {
        return { common: { prototype: null, query: null } };
      }
      const require = createRequire(directory);
      const path = require.resolve("mysql");
      return {
        common: hook(require(path), client, frontend),
      };
      // TODO: support native import
      // await Promise.all([
      //   hookAsync(require(path), promise, client, frontend),
      //   // TODO: refactor to await for loading
      //   import(path).then(({ default: Mysql }) =>
      //     hookAsync(Mysql, promise, client, frontend),
      //   ),
      // ]);
    },
    unhookMysql: ({ common: { prototype, query } }) => {
      if (prototype !== null) {
        prototype.query = query;
      }
    },
  };
};
