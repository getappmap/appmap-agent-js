export default (dependencies) => {
  const {
    source: { extractSourceMapURL, createMirrorSourceMap, createSourceMap },
    file: { readFile },
    log: { logWarning },
  } = dependencies;
  return {
    loadSourceMap: (file) => {
      const maybe_url = extractSourceMapURL(file);
      if (maybe_url === null) {
        return createMirrorSourceMap(file);
      } else {
        let content;
        try {
          content = readFile(maybe_url);
        } catch (error) {
          logWarning(
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
    },
  };
};
