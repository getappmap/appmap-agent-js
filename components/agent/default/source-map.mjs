import {
  extractMappingUrl,
  createMirrorMapping,
  createMapping,
} from "../../mapping/index.mjs";
import { readFile } from "../../file/index.mjs";
import { logDebug } from "../../log/index.mjs";

export const loadSourceMap = (file, map) => {
  if (map !== null) {
    return createMapping(map);
  } else {
    const maybe_url = extractMappingUrl(file);
    if (maybe_url === null) {
      return createMirrorMapping(file);
    } else {
      let content;
      try {
        content = readFile(maybe_url);
      } catch (error) {
        logDebug(
          "Cannot read source-map file at %j extracted from %j >> %O",
          maybe_url,
          file.url,
          error,
        );
        return createMirrorMapping(file);
      }
      return createMapping({
        url: maybe_url.startsWith("data:") ? file.url : maybe_url,
        content,
      });
    }
  }
};
