const _Promise = Promise;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { constant, returnSecond },
  } = dependencies;
  return {
    minifyReceptorConfiguration: constant({}),
    openReceptorAsync: constant(_Promise.resolve(_undefined)),
    adaptReceptorConfiguration: returnSecond,
    closeReceptorAsync: constant(_Promise.resolve(_undefined)),
  };
};
