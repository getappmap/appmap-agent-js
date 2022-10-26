const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { generateDeadcode } = await import(`../../util/index.mjs${__search}`);

export const extractRepositoryHistory = generateDeadcode(
  "cannot extract repository history (disabled functionality)",
  InternalAppmapError,
);

export const extractRepositoryPackage = generateDeadcode(
  "cannot extract repository package (disabled functionality)",
  InternalAppmapError,
);
