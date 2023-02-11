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
import { readFile } from "../../file/index.mjs";
import { logDebug } from "../../log/index.mjs";

export const fillSourceMap = (mapping) => {
  for (const url of getMappingSourceArray(mapping)
    .filter(isSourceEmpty)
    .map(getSourceUrl)) {
    updateMappingSource(mapping, createSource(url, readFile(url)));
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
