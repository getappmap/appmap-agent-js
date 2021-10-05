import Mysql from "./mysql.mjs";
import Pg from "./pg.mjs";
import Sqlite3 from "./sqlite3.mjs";

export default (dependencies) => {
  const { hookMysql, unhookMysql } = Mysql(dependencies);
  const { hookPg, unhookPg } = Pg(dependencies);
  const { hookSqlite3, unhookSqlite3 } = Sqlite3(dependencies);
  return {
    hookQuery: (emitter, frontend, configuration) => ({
      mysql: hookMysql(emitter, frontend, configuration),
      pg: hookPg(emitter, frontend, configuration),
      sqlite3: hookSqlite3(emitter, frontend, configuration),
    }),
    unhookQuery: ({ mysql, pg, sqlite3 }) => {
      unhookMysql(mysql);
      unhookPg(pg), unhookSqlite3(sqlite3);
    },
  };
};
