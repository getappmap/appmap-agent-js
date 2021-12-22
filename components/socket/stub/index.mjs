export default (dependencies) => {
  const {
    util: { noop },
  } = dependencies;
  return {
    openSocket: noop,
    closeSocket: noop,
    sendSocket: noop,
  };
};
