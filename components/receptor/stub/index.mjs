const _Promise = Promise;

export default (dependencies) => {
  const {
    util: { noop, constant },
  } = dependencies;
  return {
    openReceptorAsync: constant(_Promise.resolve(null)),
    promiseReceptorTermination: constant(_Promise.resolve(null)),
    closeReceptor: noop,
    getReceptorPort: constant(0),
  };
};
