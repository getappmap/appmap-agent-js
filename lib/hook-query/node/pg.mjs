import { createRequire } from "module";

const global_undefined = undefined;
const global_Reflect_apply = Reflect.apply;
const global_Promise = Promise;

const global_TypeError = TypeError;

export default (dependencies) => {
  const {
    frontend: { incrementEventCounter, recordBeforeQuery, recordAfterQuery },
    client: { sendClient },
  } = dependencies;
};

export const hookPG = (options, makeCouple) => {
  const { Client, Query } = requireFromHome("pg");
  let save = Client.prototype.query;
  Client.prototype.query = function query(query, values, callback) {
    checkTypeError(
      new.target === global_undefined,
      "query is not a constructor",
    );
    checkTypeError(
      query !== null && query !== global_undefined,
      "Client was passed a null or undefined query",
    );
    let result = global_undefined;
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
    const couple = makeCouple();
    couple.recordCall({
      sql_query: {
        database_type: "postgres",
        sql: query.text,
        parameters: query.values || null,
        explain_sql: null,
        server_version: null,
      },
    });
    callback = query.callback;
    query.callback = (error, result) => {
      couple.recordReturn({
        sql_result: {
          error: error ? error.message : null,
        },
      });
      callback(error, result);
    };
    global_Reflect_apply(save, this, [query]);
    return result;
  };
  return () => {
    assert(save !== null, "this pg hook has already been unhooked");
    Client.prototype.query = save;
    save = null;
  };
};
