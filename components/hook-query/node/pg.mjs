import Require from "./require.mjs";

const _undefined = undefined;
const { apply } = Reflect;
const _Promise = Promise;
const _TypeError = TypeError;

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
    hook: (agent, { repository: { directory }, hooks: { pg } }) => {
      const Postgres = requireMaybe(pg, directory, "pg");
      if (Postgres === null) {
        return [];
      }
      const empty = getSerializationEmptyValue(agent);
      const { Client, Query } = Postgres;
      const { prototype } = Client;
      const { query: original } = prototype;
      const { query } = {
        query(query, values, callback) {
          if (query === null || query === _undefined) {
            throw new _TypeError("Client was passed a null or undefined query");
          }
          let result = _undefined;
          if (typeof query.submit === "function") {
            result = query;
            if (!query.callback) {
              if (typeof values === "function") {
                query.callback = values;
              } else {
                query.callback = (error, result) => {
                  if (error !== null) {
                    query.emit("error", error);
                  }
                };
              }
            }
          } else {
            query = new Query(query, values, callback);
            if (!query.callback) {
              result = new _Promise((resolve, reject) => {
                query.callback = (error, result) => {
                  error ? reject(error) : resolve(result);
                };
              });
            }
          }
          const index1 = recordBeginBundle(agent, null);
          const index2 = recordBeforeQuery(agent, {
            database: "postgres",
            version: null,
            sql: query.text,
            parameters: query.values || {},
          });
          callback = query.callback;
          query.callback = (error, result) => {
            recordAfterQuery(agent, index2, { error: error || empty });
            callback(error, result);
            recordEndBundle(agent, index1, null);
          };
          apply(original, this, [query]);
          return result;
        },
      };
      prototype.query = query;
      return [{ object: prototype, key: "query", value: original }];
    },
  };
};
