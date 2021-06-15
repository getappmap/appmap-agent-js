// sql-trace.mjs
import {execute} from './db.mjs'
import {trace, traceAsync} from './trace.mjs'
const logTrace = (x) => trace(log, x);
const main = () => {
  traceAsync(execute, 'SELECT 2 * 3 as x').then(([{x}]) => {
    trace(console.log, x);
  });
  traceAsync(execute, 'SELECT 4 * 5 as x').then(([{x}]) => {
    trace(console.log, x);
  });
  return 0;
}
trace(main);
