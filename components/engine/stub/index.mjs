const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { constant } = await import(`../../util/index.mjs${__search}`);
export const getEngine = constant("engine@0.0.0");
