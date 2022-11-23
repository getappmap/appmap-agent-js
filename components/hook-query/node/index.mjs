const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

import { hook as hookMysql, unhook as unhookMysql } from "./mysql.mjs";
import { hook as hookPg, unhook as unhookPg } from "./pg.mjs";
import { hook as hookSqlite3, unhook as unhookSqlite3 } from "./sqlite3.mjs";

export const hook = (emitter, frontend, configuration) => ({
  mysql: hookMysql(emitter, frontend, configuration),
  pg: hookPg(emitter, frontend, configuration),
  sqlite3: hookSqlite3(emitter, frontend, configuration),
});

export const unhook = ({ mysql, pg, sqlite3 }) => {
  unhookMysql(mysql);
  unhookPg(pg);
  unhookSqlite3(sqlite3);
};
