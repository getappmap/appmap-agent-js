const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { hook: hookMysql, unhook: unhookMysql } = await import(
  `./mysql.mjs${__search}`
);
const { hook: hookPg, unhook: unhookPg } = await import(`./pg.mjs${__search}`);
const { hook: hookSqlite3, unhook: unhookSqlite3 } = await import(
  `./sqlite3.mjs${__search}`
);

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
