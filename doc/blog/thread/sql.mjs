// sql.mjs
import util from 'util';
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(':memory:');
const execute = util.promisify(db.all.bind(db));
const main = () => {
  execute('SELECT 2 * 3 as x').then(([{x}]) => {
    console.log(x);
  });
  execute('SELECT 4 * 5 as x').then(([{x}]) => {
    console.log(x);
  });
  return 0;
}
main();
