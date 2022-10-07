const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

export const spawn = (exec, argv, options) =>
  globalThis.GLOBAL_SPY_SPAWN(exec, argv, options);
