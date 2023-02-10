import { InternalAppmapError } from "../../error/index.mjs";
import { getSourceUrl } from "../../source/index.mjs";
import {
  createClassmap,
  addClassmapSource,
  lookupClassmapClosure,
} from "../../classmap/index.mjs";
import { lookupSpecifier } from "../../specifier/index.mjs";

const { Set } = globalThis;

export const createExclusion = (configuration) => {
  if (configuration["postmortem-function-exclusion"]) {
    return {
      type: "basic",
      specifiers: configuration.packages,
      default_specifier: configuration["default-package"],
      urls: new Set(),
    };
  } else {
    return {
      type: "classmap",
      classmap: createClassmap(configuration),
    };
  }
};

export const addExclusionSource = (exclusion, source) => {
  if (exclusion.type === "basic") {
    const url = getSourceUrl(source);
    const { enabled } = lookupSpecifier(
      exclusion.specifiers,
      url,
      exclusion.default_specifier,
    );
    if (enabled) {
      exclusion.urls.add(url);
    }
    return enabled;
  } else if (exclusion.type === "classmap") {
    return addClassmapSource(exclusion.classmap, source);
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid exclusion type");
  } /* c8 ignore stop */
};

export const isExcluded = (exclusion, location) => {
  if (exclusion.type === "basic") {
    return !exclusion.urls.has(location.url);
  } else if (exclusion.type === "classmap") {
    return lookupClassmapClosure(exclusion.classmap, location) === null;
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid exclusion type");
  } /* c8 ignore stop */
};
