import Require from "./require.mjs";

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

const DATABASE = "sqlite3";
const VERSION = null;

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
    util: { spyOnce, assignProperty },
    agent: {
      getFreshTab,
      recordBeginEvent,
      recordEndEvent,
      recordBeforeEvent,
      recordAfterEvent,
      formatQueryPayload,
      getAnswerPayload,
      getBundlePayload,
    },
  } = dependencies;
  const { requireMaybe } = Require(dependencies);
  return {
    unhook: (backup) => {
      backup.forEach(assignProperty);
    },
    hook: (agent, { repository: { directory }, hooks: { sqlite3 } }) => {
      const Sqlite3 = requireMaybe(sqlite3, directory, "sqlite3");
      if (Sqlite3 === null) {
        return [];
      }
      const bundle_payload = getBundlePayload(agent);
      const answer_payload = getAnswerPayload(agent);
      const { Database } = Sqlite3;
      const { prototype: database_prototype } = Database;
      const backup = ["run", "get", "all", "each", "prepare"].map((key) => ({
        object: database_prototype,
        key,
        value: database_prototype[key],
      }));
      const copy = { ...database_prototype };

      const recordQuery = (sql, parameters, callback) => {
        const bundle_tab = getFreshTab(agent);
        const jump_tab = getFreshTab(agent);
        recordBeginEvent(agent, bundle_tab, bundle_payload);
        recordBeforeEvent(
          agent,
          jump_tab,
          formatQueryPayload(agent, DATABASE, VERSION, sql, parameters),
        );
        return spyOnce(() => {
          recordAfterEvent(agent, jump_tab, answer_payload);
          recordEndEvent(agent, bundle_tab, bundle_payload);
        }, callback);
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
