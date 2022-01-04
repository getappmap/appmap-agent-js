const { parse: parseJSON } = JSON;
const _URL = URL;

export default (dependencies) => {
  const {
    expect: { expect, expectSuccess },
    util: { assert, coalesce },
    validate: { validateSourceMap },
    "source-inner": { compileSourceMap, mapSource },
    location: { makeLocation },
  } = dependencies;

  const normalizeURL = (url, relative_url) => {
    if (/^[a-z]+:/u.test(relative_url)) {
      return relative_url;
    }
    if (url.startsWith("data:")) {
      expect(
        relative_url[0] === "/",
        "Expected an unix absolute path because the reference url is a data url, got %j relative to %j",
        relative_url,
        url,
      );
      return `file://${relative_url}`;
    }
    const url_object = new _URL(url);
    if (relative_url[0] === "/") {
      url_object.pathname = relative_url;
    } else {
      const { pathname } = url_object;
      const segments = pathname.split("/");
      segments.pop();
      segments.push(...relative_url.split("/"));
      url_object.pathname = segments.join("/");
    }
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
        return makeLocation(url, line, column);
      } else {
        const { map } = mapping;
        return mapSource(map, line, column);
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
