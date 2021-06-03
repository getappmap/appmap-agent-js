const { requireHome } = require("./home.js");
const { assert } = require("../check.js");

const global_Reflect_apply = Reflect.apply;

exports.hookMySQL = (recordCall) => {
  const { format, createConnection } = requireHome("mysql");
  const Connection = createConnection({}).constructor;
  let original = Connection.prototype.query;
  Connection.prototype.query = function query(sql, values, cb) {
    const query = Connection.createQuery(sql, values, cb);
    const callback = query._callback;
    const recordReturn = recordCall("sql_query", {
      database_type: "mysql",
      sql: format(query.sql, query.values),
      explain_sql: null,
      server_version: null,
    });
    query._callback = (error, result, fields) => {
      recordReturn("sql_result", null);
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
