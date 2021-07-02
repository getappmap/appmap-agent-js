/* c8 ignore start */
const { requireHome } = require("./home.js");
const { assert } = require("../check.js");

const global_Reflect_apply = Reflect.apply;

exports.hookMySQL = (options, makeCouple) => {
  const { createConnection } = requireHome("mysql");
  // sql: format(query.sql, query.values),
  const Connection = createConnection({}).constructor;
  let original = Connection.prototype.query;
  Connection.prototype.query = function query(sql, values, cb) {
    const query = Connection.createQuery(sql, values, cb);
    const callback = query._callback;
    const couple = makeCouple();
    couple.recordCall({
      sql_query: {
        database_type: "mysql",
        sql: query.sql,
        parameters: query.values || null,
        explain_sql: null,
        server_version: null,
      },
    });
    query._callback = (error, result, fields) => {
      couple.recordReturn({
        sql_result: {
          error: error ? error.message : null,
        },
      });
      callback(error, result, fields);
    };
    return global_Reflect_apply(original, this, [query]);
  };
  return () => {
    assert(original !== null, "this mysql hook has already been stopped");
    Connection.prototype.query = original;
    original = null;
  };
};

/* c8 ignore stop */
