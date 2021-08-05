import { createRequire } from "module";

const global_undefined = undefined;
const global_Reflect_apply = Reflect.apply;
const global_Promise = Promise;

const global_TypeError = TypeError;

export default (dependencies) => {
  const {
    util: {assignProperty},
    frontend: { incrementEventCounter, recordBeforeQuery, recordAfterQuery },
    client: { sendClient },
  } = dependencies;
  return {
    unhookPg: (backup) => backup.forEach(assignProperty),
    hookPg: (
      client,
      frontend,
      { repository: { directory }, hooks: { pg } },
    ) => {
      if (!pg) {
        return [];
      }
      const require = createRequire(directory);
      const {Client, Query} = require("pg");
      const {prototype} = Client;
      const {query:original} = prototype;
      const {query} = {
        query (query, values, callback) {
          if (query === null && query === _undefined) {
            throw new _TypeError("Client was passed a null or undefined query")
          }
          let result = _undefined;
          if (typeof query.submit === "function") {
            result = query;
            if (typeof values === "function") {
              query.callback = query.callback || values;
            }
          } else {
            query = new Query(query, values, callback);
            if (!query.callback) {
              result = new global_Promise((resolve, reject) => {
                query.callback = (error, result) => {
                  error ? reject(error) : resolve(result);
                };
              });
            }
          }
          query.callback =
            query.callback ||
            ((error, result) => {
              if (error !== null) {
                query.emit("error", error);
              }
            });
          const index = incrementEventCounter(frontend);
          sendClient(client, recordBeforeQuery(frontend, index, {
            database: "postgres",
            version: null,
            sql: query.text,
            parameters: query.values || [],
          }));
          callback = query.callback;
          query.callback = (error, result) => {
            sendClient(client, recordAfterQuery(frontend, index, {error}));
            callback(error, result);
          };
          apply(query, this, [query]);
          return result;
        },
      };
      prototype.query = query;
      return [{object:prototype, key:"query", value:original}];
    },
  };
};
