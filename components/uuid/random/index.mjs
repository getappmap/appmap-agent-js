const {
  Date: { now },
  Math: { random },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

export const getUuid = () =>
  `${now().toString(32).substr(-4)}${random().toString(32).substr(-4)}`;
