const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { parse } = await import(`./parse.mjs${__search}`);
const { visit } = await import(`./visit.mjs${__search}`);

export const extractEstreeEntityArray = (relative, content, naming) =>
  visit(parse(relative, content), naming);
