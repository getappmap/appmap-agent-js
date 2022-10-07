const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

export const {
  performance: { now },
} = globalThis;
