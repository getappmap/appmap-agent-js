const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { generateDeadcode } = await import(`../../util/index.mjs${__search}`);

export const requestAsync = generateDeadcode(
  "requestAsync should not be called on http/void",
);

export const generateRespond = generateDeadcode(
  "requestAsync should not be called on http/void",
);
