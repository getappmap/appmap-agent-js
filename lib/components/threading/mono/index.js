
const {noop, constant} = require("../../util/.js");

const singleton = {
  getCurrentThreadId: constant(0),
  terminate: noop
};

const makeThreading = (enabled, onNewThread) => singleton;

module.exports = () => {makeThreading}
