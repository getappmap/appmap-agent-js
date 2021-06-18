
const {expect} = require("../../util");
const {initializePosixSocket} = require("./posix-socket.js");
const {initializeSocket} = require("./socket.js");

const initializeRequest = ({host, port}) => {
  assert(typeof port === "number" || host === "localhost" || host === "127.0.0.1", "expected localhost when provided a unix domain socket");
  const {run, terminate:terminate1} = initializePosixSocket(options);
  const {runAsync, terminate:terminate2} = initializeSocket(options);
  return {
    run,
    runAsync,
    terminate: () => {
      terminate1();
      terminate2();
    }
  };
};

module.exports = () => {initializeRequest};
