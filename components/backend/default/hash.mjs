import { hashFile } from "../../hash/index.mjs";

const { WeakMap } = globalThis;

const cache = new WeakMap();

export const hashSource = (source) => {
  if (cache.has(source)) {
    return cache.get(source);
  } else {
    const hash = hashFile(source);
    cache.set(source, hash);
    return hash;
  }
};
