import { fromSourceMessage, hashSource } from "../../source/index.mjs";

const { WeakMap } = globalThis;

const cache = new WeakMap();

export const hashSourceMessage = (message) => {
  if (cache.has(message)) {
    return cache.get(message);
  } else {
    // This is not optimal, source already has a caching mechanism.
    // We could convert source messages into sources and pass them
    // to the trace component.
    const hash = hashSource(fromSourceMessage(message));
    cache.set(message, hash);
    return hash;
  }
};
