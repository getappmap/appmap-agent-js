const { makeOptions } = require("./options.js");
const { makeAppmap } = require("../appmap.js");

export default = ({frontend}, options) => {
  const track = frontend.startTrack({
    cwd: process.cwd(),
    env: process.env,
    "class-map-pruning": false,
    "event-pruning": false,
    recorder: "normal",
    base: ".",
    ... options
  });
  process.on("exit", (code, signal) => {
    track.stop();
    frontend.terminate({
      type: "exit",
      code,
      signal
    });
  });
};

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
