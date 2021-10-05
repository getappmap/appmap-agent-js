import { createRequire } from "module";

const _undefined = undefined;
const { apply } = Reflect;
const _Promise = Promise;
const _TypeError = TypeError;

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
    unhookPg: (backup) => {
      backup.forEach(assignProperty);
    },
    hookPg: (
      emitter,
      frontend,
      { repository: { directory }, hooks: { pg } },
    ) => {
      if (!pg) {
        return [];
      }
      const empty = getSerializationEmptyValue(frontend);
      const require = createRequire(`${directory}/dummy.js`);
      const { Client, Query } = require("pg");
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
          const index1 = incrementEventCounter(frontend);
          const index2 = incrementEventCounter(frontend);
          sendEmitter(emitter, recordBeginBundle(frontend, index1, null));
          sendEmitter(
            emitter,
            recordBeforeQuery(frontend, index2, {
              database: "postgres",
              version: null,
              sql: query.text,
              parameters: query.values || {},
            }),
          );
          callback = query.callback;
          query.callback = (error, result) => {
            sendEmitter(
              emitter,
              recordAfterQuery(frontend, index2, { error: error || empty }),
            );
            callback(error, result);
            sendEmitter(emitter, recordEndBundle(frontend, index1, null));
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
