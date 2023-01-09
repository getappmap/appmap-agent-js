import Sqlite3 from "sqlite3";
const { Database } = Sqlite3;
const database = new Database(":memory:");
database.get("SELECT ? * ? as SOLUTION", 2, 3);
