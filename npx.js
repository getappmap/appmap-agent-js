const {readdirSync, readFileSync} = require("fs");
console.log(readdirSync("node_modules/.bin"));
console.log(readFileSync("node_modules/.bin/mocha.cmd", "utf8"));