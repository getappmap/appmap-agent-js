const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { generateDeadcode } = await import(`../../util/index.mjs${__search}`);

export const extractRepositoryHistory = generateDeadcode(
  "cannot extract repository history (disabled functionality)",
);

export const extractRepositoryPackage = generateDeadcode(
  "cannot extract repository package (disabled functionality)",
);

export const extractRepositoryDependency = generateDeadcode(
  "cannot extract repository dependency package (disabled functionality)",
);
