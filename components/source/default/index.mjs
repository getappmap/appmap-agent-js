/* globals URL */

const { parse: parseJSON } = JSON;
const _URL = URL;

export default (dependencies) => {
  const {
    expect: { expectSuccess },
    log: { logWarning },
    util: { assert, toAbsolutePath, getDirectory, coalesce },
    validate: { validateSourceMap },
    "source-inner": { compileSourceMap, mapSource },
  } = dependencies;

  const normalizeURL = (url, relative_url) => {
    if (/^[a-z]+:\/\//u.test(relative_url)) {
      return relative_url;
    }
    const url_object = new _URL(url);
    const { pathname: path } = url_object;
    url_object.pathname = toAbsolutePath(getDirectory(path), relative_url);
    return url_object.toString();
  };

  const normalizePayload = (url, payload) => {
    validateSourceMap(payload);
    const { sources } = payload;
    const prefix = coalesce(payload, "sourceRoot", null);
    const contents = coalesce(payload, "sourcesContent", null);
    return {
      ...payload,
      sourceRoot: "",
      sources: sources.map((relative_url) =>
        normalizeURL(url, `${prefix === null ? "" : prefix}${relative_url}`),
      ),
      sourcesContent: sources.map((url, index) =>
        coalesce(contents, index, null),
      ),
    };
  };

  return {
    extractSourceMapURL: ({ url, content }) => {
      const parts = /\/\/# sourceMappingURL=(.*)$/u.exec(content);
      if (parts === null) {
        return null;
      }
      return normalizeURL(url, parts[1]);
    },

    createMirrorSourceMap: ({ url, content }) => {
      return { mirrored: true, url, content };
    },

    createSourceMap: ({ url, content }) => {
      const payload = normalizePayload(
        url,
        expectSuccess(
          () => parseJSON(content),
          "Invalid JSON format for source map at %j >> %e",
          url,
        ),
      );
      return {
        mirrored: false,
        payload,
        map: compileSourceMap(payload),
      };
    },

    mapSource: (mapping, line, column) => {
      const { mirrored } = mapping;
      if (mirrored) {
        const { url } = mapping;
        return { url, line, column };
      } else {
        const { map } = mapping;
        const location = mapSource(map, line, column);
        if (location === null) {
          const {
            payload: { file: url },
          } = mapping;
          logWarning(
            "Missing source map at file %j at line %j at column %j",
            url,
            line,
            column,
          );
        }
        return location;
      }
    },

    setSourceContent: (mapping, { url, content }) => {
      const { mirrored } = mapping;
      assert(!mirrored, "mirrored source mapping should never be completed");
      const {
        payload: { sourcesContent: contents, sources: urls },
      } = mapping;
      const index = urls.indexOf(url);
      assert(index !== -1, "missing source url to set content");
      assert(
        contents[index] === null,
        "source content has already been assigned",
      );
      contents[index] = content;
    },

    getSources: (mapping) => {
      const { mirrored } = mapping;
      if (mirrored) {
        const { url, content } = mapping;
        return [{ url, content }];
      }
      const {
        payload: { sources: urls, sourcesContent: contents },
      } = mapping;
      return urls.map((url, index) => ({
        url,
        content: contents[index],
      }));
    },
  };
};
