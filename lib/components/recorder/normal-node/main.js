const { makeOptions } = require("./options.js");
const { makeAppmap } = require("../appmap.js");

exports.main = (process) => {
  const appmap = makeAppmap(makeOptions(process));
  const tape = appmap.start({
    cwd: process.cwd(),
    env: process.env,
    data: {
      "class-map-pruning": false,
      "event-pruning": false,
      recorder: "normal",
      base: ".",
    }
  });
  process.on("exit", (code, signal) => {
    tape.stop();
    appmap.terminate({ type: "exit", code, signal });
  });
};
