import {
  extractMappingUrl,
  createMapping,
  createMirrorMapping,
  getMappingSourceArray,
  updateMappingSource,
} from "../../mapping/index.mjs";
import {
  createSource,
  isSourceEmpty,
  getSourceUrl,
} from "../../source/index.mjs";
import { getConfigurationPackage } from "../../configuration-accessor/index.mjs";
import { readFile } from "../../file/index.mjs";
import { logDebug } from "../../log/index.mjs";

export const fillSourceMap = (mapping, configuration) => {
  for (const url of getMappingSourceArray(mapping)
    .filter(isSourceEmpty)
    .map(getSourceUrl)) {
    if (getConfigurationPackage(configuration, url).enabled) {
      let content = null;
      try {
        // TODO
        // Lookup the url in `configuration.packages` to see whether the url is
        // enabled. If it is disabled, we can improve performance by not trying
        // to load the source file.
        content = readFile(url);
      } catch (error) {
        logDebug("could not load source file %j >> %O", url, error);
      }
      if (content !== null) {
        updateMappingSource(mapping, createSource(url, content));
      }
    }
  }
};

export const loadSourceMap = (source, map) => {
  if (map !== null) {
    return createMapping(map);
  } else {
    const maybe_url = extractMappingUrl(source);
    if (maybe_url === null) {
      return createMirrorMapping(source);
    } else {
      let content;
      try {
        content = readFile(maybe_url);
      } catch (error) {
        logDebug(
          "Cannot read source-map file at %j extracted from %j >> %O",
          maybe_url,
          getSourceUrl(source),
          error,
        );
        return createMirrorMapping(source);
      }
      return createMapping({
        url: maybe_url.startsWith("data:") ? getSourceUrl(source) : maybe_url,
        content,
      });
    }
  }
};
