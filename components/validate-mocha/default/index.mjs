const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logErrorWhen } = await import(`../../log/index.mjs${__search}`);
const { assert, coalesce, matchVersion } = await import(
  `../../util/index.mjs${__search}`
);

const { undefined } = globalThis;

export const validateMocha = (Mocha) => {
  const prototype = coalesce(Mocha, "prototype", undefined);
  const version = coalesce(prototype, "version", undefined);
  assert(
    !logErrorWhen(
      typeof version !== "string",
      "Mocha.prototype.version should be a string but got: %o.",
      version,
    ),
    "Invalid mocha version type",
    ExternalAppmapError,
  );
  assert(
    !logErrorWhen(
      !matchVersion(version, "8.0.0"),
      "Expected Mocha.prototype.version >= 8.0.0 but got: %o",
      version,
    ),
    "Incompatible mocha version",
    ExternalAppmapError,
  );
};
