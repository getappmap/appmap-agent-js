// db.mjs
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(':memory:');
export const execute = (sql) => new Promise((resolve, reject) => {
  db.all(sql, (error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  });
});
