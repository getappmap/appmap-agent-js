import { InternalAppmapError } from "../../error/index.mjs";
import { lookupSpecifier } from "../../specifier/index.mjs";

const { Set } = globalThis;

export const createExclusion = (configuration) => ({
  type: "basic",
  specifiers: configuration.packages,
  default_specifier: configuration["default-package"],
  urls: new Set(),
});

export const addExclusionSource = (exclusion, source) => {
  if (exclusion.type === "basic") {
    const { enabled } = lookupSpecifier(
      exclusion.specifiers,
      source.url,
      exclusion.default_specifier,
    );
    if (enabled) {
      exclusion.urls.add(source.url);
    }
    return enabled;
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid exclusion type");
  } /* c8 ignore stop */
};

export const isExcluded = (exclusion, location) => {
  if (exclusion.type === "basic") {
    return !exclusion.urls.has(location.url);
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid exclusion type");
  } /* c8 ignore stop */
};
