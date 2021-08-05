import {createRequire} from "module";

setTimeout(() => {
  const require = createRequire(import.meta.url);
  global.MYSQL = require("mysql");
}, 1000);
