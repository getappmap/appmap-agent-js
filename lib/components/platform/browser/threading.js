
const {noop, constant} = require("../../util/.js");

const singleton = {
  getCurrentThreadId: constant(0),
  terminate: noop
};

module.exports = () => (onNewThread) => singleton;
