import Mysql from "./mysql.mjs";
import Pg from "./pg.mjs";
import Sqlite3 from "./sqlite3.mjs";

export default (dependencies) => {
  const { hook: hookMysql, unhook: unhookMysql } = Mysql(dependencies);
  const { hook: hookPg, unhook: unhookPg } = Pg(dependencies);
  const { hook: hookSqlite3, unhook: unhookSqlite3 } = Sqlite3(dependencies);
  return {
    hook: (emitter, frontend, configuration) => ({
      mysql: hookMysql(emitter, frontend, configuration),
      pg: hookPg(emitter, frontend, configuration),
      sqlite3: hookSqlite3(emitter, frontend, configuration),
    }),
    unhook: ({ mysql, pg, sqlite3 }) => {
      unhookMysql(mysql);
      unhookPg(pg);
      unhookSqlite3(sqlite3);
    },
  };
};
