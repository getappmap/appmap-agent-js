import { assert } from "../../util/index.mjs";
import { logWarning } from "../../log/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import {
  extractSourcemapUrl,
  parseSourcemap,
  compileSourcemap,
  mapPosition,
} from "./sourcemap.mjs";
import {
  createSource,
  isSourceEnabled,
  getSourceFile,
  parseSource,
  isSourceContentRequired,
  resolveClosureLocation as resolveClosureLocationInner,
} from "./source.mjs";

const getUrl = ({ url }) => url;

export const extractMissingUrlArray = (url, cache, configuration) => {
  if (cache.has(url)) {
    const map_url = extractSourcemapUrl({
      url,
      content: cache.get(url),
    });
    if (map_url === null) {
      return [];
    } else {
      if (cache.has(map_url)) {
        const sourcemap = parseSourcemap(
          {
            url: map_url,
            content: cache.get(map_url),
          },
          url,
        );
        if (sourcemap === null) {
          return [];
        } else {
          const { sources } = sourcemap;
          return sources
            .filter(
              ({ url, content }) =>
                content === null &&
                !cache.has(url) &&
                isSourceContentRequired(
                  createSource({ url, content }, configuration),
                ),
            )
            .map(getUrl);
        }
      } else {
        return [map_url];
      }
    }
  } else {
    return [url];
  }
};

const loadSourcemap = (file, cache, configuration) => {
  const map_url = extractSourcemapUrl(file);
  if (map_url === null) {
    return null;
  } else {
    const { url } = file;
    if (cache.has(map_url)) {
      const sourcemap = parseSourcemap(
        {
          url: map_url,
          content: cache.get(map_url),
        },
        url,
      );
      if (sourcemap === null) {
        return null;
      } else {
        const { sources, payload } = sourcemap;
        return {
          mapping: compileSourcemap(payload),
          sources: sources.map(({ url, content }) =>
            createSource(
              {
                url,
                content:
                  content === null && cache.has(url) ? cache.get(url) : content,
              },
              configuration,
            ),
          ),
        };
      }
    } else {
      return null;
    }
  }
};

export const createCodebase = (url, cache, configuration) => {
  assert(cache.has(url), "missing main content", InternalAppmapError);
  const content = cache.get(url);
  const file = { url, content };
  return {
    main: createSource(file, configuration),
    sourcemap: loadSourcemap(file, cache, configuration),
  };
};

export const getEnabledSourceFileArray = ({ main, sourcemap }) =>
  (sourcemap === null ? [main] : sourcemap.sources)
    .filter(isSourceEnabled)
    .map(getSourceFile);

export const getMainFile = ({ main }) => getSourceFile(main);

export const parseMain = ({ main }) => parseSource(main);

export const resolveClosureLocation = ({ main, sourcemap }, position) => {
  if (sourcemap === null) {
    return resolveClosureLocationInner(main, position);
  } else {
    const { sources, mapping } = sourcemap;
    const maybe_indexed_position = mapPosition(mapping, position);
    if (maybe_indexed_position === null) {
      // This is fine, it happens when compilation introduces new functions.
      // eg:
      // ```js
      //   var __importDefault = (this && this.__importDefault) || function (mod) {
      //     return (mod && mod.__esModule) ? mod : { "default": mod };
      //   };
      // ```
      return null;
    } else {
      const { index, position: mapped_position } = maybe_indexed_position;
      if (index >= 0 && index < sources.length) {
        return resolveClosureLocationInner(sources[index], mapped_position);
      } /* c8 ignore start */ else {
        logWarning(
          "Treating %j in %j as excluded because its mapped source index is out-of-range",
          position,
          getSourceFile(main).url,
        );
        return null;
      } /* c8 ignore stop */
    }
  }
};
