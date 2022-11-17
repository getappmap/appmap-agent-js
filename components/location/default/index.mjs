const { String, parseInt, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { assert } = await import(`../../util/index.mjs${__search}`);

export const makeLocation = (url, { line, column }) =>
  new URL(`#${String(line)}-${String(column)}`, url).toString();

export const getLocationPosition = (url) => {
  const { hash } = new URL(url);
  const parts = /^#([0-9]+)-([0-9]+)$/u.exec(hash);
  assert(parts !== null, "expected a url code location", InternalAppmapError);
  return {
    line: parseInt(parts[1]),
    column: parseInt(parts[2]),
  };
};

export const getLocationBase = (url) => {
  const object_url = new URL(url);
  object_url.hash = "";
  return object_url.toString();
};
