const _Promise = Promise;

export default (dependencies) => {
  const {
    util: { noop, constant },
  } = dependencies;
  return {
    openServerAsync: constant(_Promise.resolve(null)),
    promiseServerTermination: constant(_Promise.resolve(null)),
    closeServer: noop,
    getServerPort: constant(0),
  };
};
