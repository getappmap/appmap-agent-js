const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logError } = await import(`../../log/index.mjs${__search}`);

import AppmapValidate from "@appland/appmap-validate";

const { validate: validateAppmapInner } = AppmapValidate;

const version = "1.8.0";

export const validateAppmap = (data) => {
  try {
    validateAppmapInner(data, { version });
  } catch (error) {
    logError("Invalid %s appmap >> %O\n>>%j", version, error, data);
    throw new InternalAppmapError("Invalid appmap");
  }
};
