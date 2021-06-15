// sql.mjs
import {execute} from './db.mjs';
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
