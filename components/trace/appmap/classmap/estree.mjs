const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { parse, getLeadingCommentArray } = await import(
  `./parse.mjs${__search}`
);
const { visit } = await import(`./visit.mjs${__search}`);

export const extractEstreeEntityArray = (path, content, naming) =>
  visit(parse(path, content), {
    naming,
    getLeadingCommentArray,
  });
