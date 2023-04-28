import { hook as hookMysql, unhook as unhookMysql } from "./mysql.mjs";
import { hook as hookPg, unhook as unhookPg } from "./pg.mjs";
import { hook as hookSqlite3, unhook as unhookSqlite3 } from "./sqlite3.mjs";

export const hook = (frontend, socket, configuration) => ({
  mysql: hookMysql(frontend, socket, configuration),
  pg: hookPg(frontend, socket, configuration),
  sqlite3: hookSqlite3(frontend, socket, configuration),
});

export const unhook = ({ mysql, pg, sqlite3 }) => {
  unhookMysql(mysql);
  unhookPg(pg);
  unhookSqlite3(sqlite3);
};
