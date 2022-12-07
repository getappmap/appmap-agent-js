const {
  performance,
  Math: { round },
} = globalThis;

export const now = () => round(1000 * performance.now()) / 1000;
