const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(':memory:');

console.log("query1")
db.get("SELECT 2 * 3 as x;", (error, row) => {
  console.assert(error === null);
  console.log("result1", row.x);
});

console.log("query2");
db.get("SELECT 4 * 5 as x;", (error, row) => {
  console.assert(error === null);
  console.log("result2", row.x);
});
