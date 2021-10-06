const _Promise = Promise;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { constant },
  } = dependencies;
  return {
    openReceptorAsync: constant(_Promise.resolve(_undefined)),
    getReceptorTracePort: constant(0),
    getReceptorTrackPort: constant(0),
    closeReceptorAsync: constant(_Promise.resolve(_undefined)),
  };
};
