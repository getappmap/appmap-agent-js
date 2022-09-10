export default (_dependencies) => {
  return {
    spawn: (exec, argv, options) =>
      globalThis.GLOBAL_SPY_SPAWN(exec, argv, options),
  };
};
