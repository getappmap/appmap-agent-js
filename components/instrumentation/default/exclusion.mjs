import { InternalAppmapError } from "../../error/index.mjs";
import { getSourceUrl } from "../../source/index.mjs";
import {
  createClassmap,
  addClassmapSource,
  lookupClassmapClosure,
} from "../../classmap/index.mjs";
import { lookupUrl } from "../../matcher/index.mjs";

const { Set } = globalThis;

// In the case of mirror mapping, we are going to parse the source anyway for
// instrumentation. This mitigates the cost for early function exclusion.
const shouldExcludeFunctionPostmortem = (postmortem, is_mirror_mapping) =>
  postmortem === null ? !is_mirror_mapping : postmortem;

export const createExclusion = (configuration, is_mirror_mapping) => {
  if (
    shouldExcludeFunctionPostmortem(
      configuration["postmortem-function-exclusion"],
      is_mirror_mapping,
    )
  ) {
    return {
      type: "basic",
      packages: configuration.packages,
      default_package: configuration["default-package"],
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
    const { enabled } = lookupUrl(
      exclusion.packages,
      url,
      exclusion.default_package,
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
