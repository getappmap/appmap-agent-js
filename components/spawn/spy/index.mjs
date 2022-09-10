export default (_dependencies) => ({
  spawn: (exec, argv, options) =>
    globalThis.GLOBAL_SPY_SPAWN(exec, argv, options),
});
