const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import AppmapValidate from "@appland/appmap-validate";
const { expectSuccess } = await import(`../../expect/index.mjs${__search}`);

const { validate: validateAppmapInner } = AppmapValidate;

export const validateAppmap = (data) => {
  expectSuccess(
    () => validateAppmapInner(data, { version: "1.8.0" }),
    "failed to validate appmap\n%j\n%O",
    data,
  );
};
