
import { assert } from "../../../util.mjs";
import { requireFromHome } from "./home.mjs";

const {apply} = Reflect;

export default (dependencies) => {
  const {
    frontend: {instrument, recordBeforeQuery, recordApplyQuery},
    client: {sendClient},
  } = dependencies;
  return {
    hookMySQLAsync: async ({promise, client, frontend, options}) => {
      if (!coalese(options, "hook-mysql", false)) {
        return promise;
      }
      const MySQL = requireFromHome("mysql");
      const {prototype, createQuery} = MySQL;
      const {query:original} = prototype;
      prototype.query = function query(sql, values, cb) {
        const query = createQuery(sql, values, cb);
        const {sql, values, _callback} = query;
        const index = incrementEventCounter(frontend);
        sendClient(
          client,
          recordBeforeQuery(
            frontend,
            index,
            {
              database: "mysql",
              sql,
              parameters: values || null,
            },
          ),
        );
        query._callback = (error, result, fields) => {
          sendClient(
            client,
            recordAfterQuery(
              frontend,
              index,
              null,
            ),
          );
          _callback(error, result, fields);
        };
        return apply(original, this, [query]);
      };
      try {
        await promise;
      } finally {
        prototype.query = original
      }
    };
  };
};
