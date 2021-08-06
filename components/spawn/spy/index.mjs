/* globals GLOBAL_SPY_SPAWN_ASYNC */

export default (dependencies) => {
  return {
    spawnAsync: (exec, argv, options) =>
      GLOBAL_SPY_SPAWN_ASYNC(exec, argv, options),
  };
};
