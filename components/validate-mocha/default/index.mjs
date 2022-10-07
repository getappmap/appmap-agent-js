const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { expect } = await import(`../../expect/index.mjs${__search}`);
const { coalesce, matchVersion } = await import(
  `../../util/index.mjs${__search}`
);

const { undefined } = globalThis;

export const validateMocha = (Mocha) => {
  const prototype = coalesce(Mocha, "prototype", undefined);
  const version = coalesce(prototype, "version", undefined);
  expect(
    typeof version === "string",
    "Mocha.prototype.version should be a string but got: %o.",
    version,
  );
  expect(
    matchVersion(version, "8.0.0"),
    "Expected Mocha.prototype.version >= 8.0.0 but got: %o",
    version,
  );
};
