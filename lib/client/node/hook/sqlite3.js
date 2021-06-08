const { requireHome } = require("./home.js");
const { assert, checkError, check } = require("../check.js");

const global_Array_isArray = Array.isArray;
const global_Reflect_ownKeys = Reflect.ownKeys;
const global_Reflect_apply = Reflect.apply;
const global_Array_prototype_concat = Array.prototype.concat;
const global_Object_assign = Object.assign;
const global_TypeError = TypeError;

const throwError = (error) => {
  checkError(error === null, error);
};

const isJSONPrimitive = (value) =>
  value === null ||
  typeof value === "boolean" ||
  typeof value === "number" ||
  typeof value === "string";

const extractEach = (args) => {
  let each = throwError;
  if (args.length > 0 && typeof args[args.length - 1] === "function") {
    if (args.length > 1 && typeof args[args.length - 2] === "function") {
      each = args[args.length - 2];
      args[args.length - 2] = args[args.length - 1];
    } else {
      each = args[args.length - 1];
    }
    args.length -= 1;
  }
  return each;
};

const normalizeDatabaseArguments = (args) => {
  check(args.length > 0, global_TypeError, "missing sql query string");
  const sql = args[0];
  check(
    typeof sql === "string",
    global_TypeError,
    "first argument is expected to be a sql query string"
  );
  for (let index = 1; index < args.length; index += 1) {
    args[index - 1] = args[index];
  }
  args.length -= 1;
  const { parameters, callback } = normalizeStatementArguments(args);
  return { sql, parameters, callback };
};

const normalizeStatementArguments = (args) => {
  if (args.length === 0 || typeof args[args.length - 1] !== "function") {
    args[args.length] = throwError;
  }
  if (args.length === 1) {
    args = [[], args[0]];
  } else if (args.length > 2) {
    const parameters = [];
    for (let index = 0; index < args.length - 1; index += 1) {
      parameters[parameters.length] = args[index];
    }
    args = [parameters, args[args.length - 1]];
  }
  let { 0: parameters, 1: callback } = args;
  if (typeof parameters !== "object" || parameters === null) {
    parameters = [parameters];
  }
  if (global_Array_isArray(parameters)) {
    for (let index = 0; index < parameters.length; index += 1) {
      check(
        isJSONPrimitive(parameters[index]),
        global_TypeError,
        "invalid parameter type"
      );
    }
  } else {
    const keys = global_Reflect_ownKeys(parameters);
    for (let index = 0; index < keys.length; index += 1) {
      check(
        isJSONPrimitive(parameters[keys[index]]),
        global_TypeError,
        "invalid parameter type"
      );
    }
  }
  return {
    parameters,
    callback,
  };
};

const combine = (parameters1, parameters2) => {
  if (global_Array_isArray(parameters1) && parameters1.length === 0) {
    return parameters2;
  }
  if (global_Array_isArray(parameters2) && parameters2.length === 0) {
    return parameters1;
  }
  if (global_Array_isArray(parameters1) && global_Array_isArray(parameters2)) {
    return global_Reflect_apply(
      global_Array_prototype_concat,
      [],
      [parameters1, parameters2]
    );
  }
  return global_Object_assign({}, parameters1, parameters2);
};

exports.hookSQLite3 = (options, makeCouple) => {
  const recordSQLCall = (sql, parameters, callback) => {
    const couple = makeCouple();
    couple.recordCall("sql_query", {
      database_type: "sqlite3",
      sql,
      parameters,
      explain_sql: null,
      server_version: null,
    });
    return (error, result) => {
      couple.recordReturn("sql_result", {
        error: error ? error.message : error,
      });
      callback(error, result);
    };
  };
  const { Database } = requireHome("sqlite3");
  const prototype = {
    run: null,
    all: null,
    get: null,
    each: function each(...args) {
      const each = extractEach(args);
      let { parameters, callback } = normalizeStatementArguments(args);
      parameters = combine(this._parameters, parameters);
      this._statement.each(
        parameters,
        each,
        recordSQLCall(this._sql, parameters, callback)
      );
      return this;
    },
    bind: function bind(...args) {
      const { parameters, callback } = normalizeStatementArguments(args);
      this._parameters = parameters;
      this._statement.reset(callback);
      return this;
    },
    reset: function reset(callback) {
      this._statement.reset(callback);
      return this;
    },
    finalize: function finalize(callback) {
      this._statement.finalize(callback);
      return this;
    },
  };
  {
    const keys = global_Reflect_ownKeys(prototype);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (prototype[key] === null) {
        prototype[key] = function (...args) {
          let { parameters, callback } = normalizeStatementArguments(args);
          parameters = combine(this._parameters, parameters);
          this._statement[key](
            parameters,
            recordSQLCall(this._sql, parameters, callback)
          );
          return this;
        };
      }
    }
  }
  let save = { __proto__: null };
  {
    const keys = ["run", "get", "all", "each", "exec", "prepare"];
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      save[key] = Database.prototype[key];
      if (key === "prepare") {
        Database.prototype.prepare = function (...args) {
          const { sql, parameters, callback } =
            normalizeDatabaseArguments(args);
          return {
            __proto__: prototype,
            _statement: global_Reflect_apply(save.prepare, this, [
              sql,
              callback,
            ]),
            _sql: sql,
            _parameters: parameters,
          };
        };
      } else if (key === "each") {
        Database.prototype.each = function (...args) {
          const each = extractEach(args);
          const { sql, parameters, callback } =
            normalizeDatabaseArguments(args);
          return global_Reflect_apply(save.each, this, [
            sql,
            parameters,
            each,
            recordSQLCall(sql, parameters, callback),
          ]);
        };
        // Database.prototype.exec is non mutable :(
        // } else if (key === "exec") {
        //   Database.prototype.exec = function (...args) {
        //     const {sql, callback} = normalizeDatabaseArguments(args);
        //     return global_Reflect_apply(
        //       save.exec,
        //       this,
        //       [sql, recordSQLCall(sql, null, callback)]
        //     );
        //   }
      } else {
        Database.prototype[key] = function (...args) {
          const { sql, parameters, callback } =
            normalizeDatabaseArguments(args);
          return global_Reflect_apply(save[key], this, [
            sql,
            parameters,
            recordSQLCall(sql, parameters, callback),
          ]);
        };
      }
    }
  }
  return () => {
    assert(save !== null, "sqlite3 hook already unhooked");
    for (const key in save) {
      Database.prototype[key] = save[key];
    }
    save = null;
  };
};
