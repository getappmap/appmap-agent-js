import { createRequire } from "module";

const { isArray } = Array;
const { assign } = Object;
const { apply } = Reflect;
const _TypeError = TypeError;

const throwIfNotNull = (error) => {
  /* c8 ignore start */
  if (error !== null) {
    throw error;
  }
  /* c8 ignore stop */
};

const extractEach = (args) => {
  let each = throwIfNotNull;
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
  if (args.length === 0) {
    throw new _TypeError("missing sql query string");
  }
  const sql = args[0];
  if (typeof sql !== "string") {
    throw new _TypeError("first argument is expected to be a sql query string");
  }
  for (let index = 1; index < args.length; index += 1) {
    args[index - 1] = args[index];
  }
  args.length -= 1;
  const { parameters, callback } = normalizeStatementArguments(args);
  return { sql, parameters, callback };
};

const normalizeStatementArguments = (args) => {
  if (args.length === 0 || typeof args[args.length - 1] !== "function") {
    args[args.length] = throwIfNotNull;
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
  let [parameters, callback] = args;
  if (typeof parameters !== "object" || parameters === null) {
    parameters = [parameters];
  }
  return {
    parameters,
    callback,
  };
};

const combine = (parameters1, parameters2) => {
  if (isArray(parameters1) && parameters1.length === 0) {
    return parameters2;
  }
  if (isArray(parameters2) && parameters2.length === 0) {
    return parameters1;
  }
  if (isArray(parameters1) && isArray(parameters2)) {
    return [...parameters1, ...parameters2];
  }
  return { ...parameters1, ...parameters2 };
};

export default (dependencies) => {
  const {
    util: { assignProperty, coalesce },
    frontend: {
      getSerializationEmptyValue,
      incrementEventCounter,
      recordBeforeQuery,
      recordAfterQuery,
      recordBeginBundle,
      recordEndBundle,
    },
    client: { sendClient },
  } = dependencies;
  return {
    unhookSqlite3: (backup) => {
      backup.forEach(assignProperty);
    },
    hookSqlite3: (
      client,
      frontend,
      { repository: { directory }, hooks: { sqlite3 } },
    ) => {
      if (!sqlite3) {
        return [];
      }
      const empty = getSerializationEmptyValue(frontend);
      const require = createRequire(`${directory}/dummy.js`);
      const { Database } = require("sqlite3");
      const { prototype: database_prototype } = Database;
      const backup = ["run", "get", "all", "each", "prepare"].map((key) => ({
        object: database_prototype,
        key,
        value: database_prototype[key],
      }));
      const copy = { ...database_prototype };
      const recordQuery = (sql, parameters, callback) => {
        const index1 = incrementEventCounter(frontend);
        const index2 = incrementEventCounter(frontend);
        sendClient(client, recordBeginBundle(frontend, index1));
        sendClient(
          client,
          recordBeforeQuery(frontend, index2, {
            database: "sqlite3",
            version: null,
            sql,
            parameters,
          }),
        );
        return function (...args) {
          sendClient(
            client,
            recordAfterQuery(frontend, index2, {
              error: coalesce(args, 0, null) || empty,
            }),
          );
          try {
            return apply(callback, this, args);
          } finally {
            sendClient(client, recordEndBundle(frontend, index1));
          }
        };
      };

      /////////////////////////////////
      // Direct Database method call //
      /////////////////////////////////

      database_prototype.each = function each(...args) {
        const each = extractEach(args);
        const { sql, parameters, callback } = normalizeDatabaseArguments(args);
        return apply(copy.each, this, [
          sql,
          parameters,
          each,
          recordQuery(sql, parameters, callback),
        ]);
      };

      for (const key of ["run", "all", "get"]) {
        database_prototype[key] = function (...args) {
          const { sql, parameters, callback } =
            normalizeDatabaseArguments(args);
          return apply(copy[key], this, [
            sql,
            parameters,
            recordQuery(sql, parameters, callback),
          ]);
        };
      }

      // Database.prototype.exec is immutable :(
      // database_prototype.exec = function exec (...args) {
      //   const {sql, callback} = normalizeDatabaseArguments(args);
      //   return apply(
      //     save.exec,
      //     this,
      //     [sql, recordQuery(sql, null, callback)]
      //   );
      // }

      ////////////////////////
      // Prepared Statement //
      ////////////////////////

      // NB: Statement.prototype is largely immutable, that is why we need
      // to perform object composition instead of simple prototype assignments.

      function Statement(database, sql, parameters, callback) {
        const statement = apply(copy.prepare, database, [sql, callback]);
        statement._appmap_statement = this;
        this._appmap_statement = statement;
        this._appmap_sql = sql;
        this._appmap_parameters = parameters;
      }
      const { prototype: statement_prototype } = Statement;
      assign(statement_prototype, {
        run: null,
        all: null,
        get: null,
        each: function each(...args) {
          const each = extractEach(args);
          let { parameters, callback } = normalizeStatementArguments(args);
          parameters = combine(this._appmap_parameters, parameters);
          this._appmap_statement.each(
            parameters,
            each,
            recordQuery(this._appmap_sql, parameters, callback),
          );
          return this;
        },
        bind: function bind(...args) {
          const { parameters, callback } = normalizeStatementArguments(args);
          this._appmap_parameters = parameters;
          this._appmap_statement.reset(callback);
          return this;
        },
        reset: function reset(callback) {
          this._appmap_statement.reset(callback);
          return this;
        },
        finalize: function finalize(callback) {
          this._appmap_statement.finalize(callback);
          return this;
        },
      });

      for (const key of ["run", "all", "get"]) {
        statement_prototype[key] = function (...args) {
          let { parameters, callback } = normalizeStatementArguments(args);
          parameters = combine(this._appmap_parameters, parameters);
          this._appmap_statement[key](
            parameters,
            recordQuery(this._appmap_sql, parameters, callback),
          );
          return this;
        };
      }

      database_prototype.prepare = function (...args) {
        const { sql, parameters, callback } = normalizeDatabaseArguments(args);
        return new Statement(this, sql, parameters, callback);
      };

      return backup;
    },
  };
};
