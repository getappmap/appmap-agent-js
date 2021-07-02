const Module = require("module");

let parts = __dirname.split("/");
parts = parts.slice(0, parts.length - 4);

let home = "";
for (let index = 0; index < parts.length; index += 1) {
  /* c8 ignore start */
  if (parts[index] === "node_modules") {
    break;
  }
  /* c8 ignore stop */
  home = `${home}${parts[index]}/`;
}

exports.requireHome = Module.createRequire(home);
