const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const {
  performance,
  Math: { round },
} = globalThis;

export const now = () => round(1000 * performance.now()) / 1000;
