
const {
  Promise,
  undefined,
} = globalThis;

export default (dependencies) => {
  const {
    util: { constant, returnSecond },
  } = dependencies;
  return {
    minifyReceptorConfiguration: constant({}),
    openReceptorAsync: constant(Promise.resolve(undefined)),
    adaptReceptorConfiguration: returnSecond,
    closeReceptorAsync: constant(Promise.resolve(undefined)),
  };
};
