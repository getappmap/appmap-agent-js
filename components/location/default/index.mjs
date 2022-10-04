const {
  URL,
  JSON: { parse: parseJSON, stringify: stringifyJSON },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

export const makeLocation = (url, line, column) => ({ url, line, column });

export const stringifyLocation = stringifyJSON;

export const parseLocation = parseJSON;

export const getLocationFileURL = ({ url }) => url;

export const incrementLocationColumn = ({ url, line, column }) => ({
  url,
  line,
  column: column + 1,
});
