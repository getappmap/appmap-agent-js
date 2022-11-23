const {
  Date: { now },
  Math: { random },
} = globalThis;

export const getUuid = () =>
  `${now().toString(32).substr(-4)}${random().toString(32).substr(-4)}`;
