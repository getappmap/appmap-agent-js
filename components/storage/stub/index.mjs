export default (dependencies) => {
  const {
    util: { noop, constant },
  } = dependencies;
  return {
    createStorage: noop,
    store: noop,
    storeAsync: constant(Promise.resolve(undefined)),
  };
};
