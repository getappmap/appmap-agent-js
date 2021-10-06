/* globals GLOBAL_SPY_SPAWN, GLOBAL_SPY_FORK */

export default (dependencies) => {
  return {
    spawn: (exec, argv, options) => GLOBAL_SPY_SPAWN(exec, argv, options),
    fork: (path, argv, options) => GLOBAL_SPY_FORK(path, argv, options),
  };
};
