import {
  extractSourceMapUrl,
  createMirrorSourceMap,
  createSourceMap,
} from "../../mapping/index.mjs";
import { readFile } from "../../file/index.mjs";
import { logDebug } from "../../log/index.mjs";

export const loadSourceMap = (file, map) => {
  if (map !== null) {
    return createSourceMap(map);
  } else {
    const maybe_url = extractSourceMapUrl(file);
    if (maybe_url === null) {
      return createMirrorSourceMap(file);
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
        return createMirrorSourceMap(file);
      }
      return createSourceMap({
        url: maybe_url.startsWith("data:") ? file.url : maybe_url,
        content,
      });
    }
  }
};
