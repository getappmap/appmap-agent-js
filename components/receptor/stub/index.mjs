const { Promise, undefined, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { constant, returnSecond } = await import(
  `../../util/index.mjs${__search}`
);

export const minifyReceptorConfiguration = constant({});

export const openReceptorAsync = constant(Promise.resolve(undefined));

export const adaptReceptorConfiguration = returnSecond;

export const closeReceptorAsync = constant(Promise.resolve(undefined));
