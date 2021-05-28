const { makeOptions } = require("./options.js");
const { makeAppmap } = require("../appmap.js");

exports.main = (process) => {
  const appmap = makeAppmap(makeOptions(process));

  process.on("exit", (code, signal) => {
    appmap.terminate({ type: "exit", code, signal });
  });

  appmap.start({
    cwd: process.cwd(),
    "class-map-pruning": false,
    "event-pruning": false,
    recorder: "normal",
    base: ".",
  });
};
