import File from "./file.mjs";

export default (dependencies) => {
  const {
    log: { logWarning },
    util: { isLeft, fromLeft, fromRight },
    source: {
      extractSourceMapURL,
      createSourceMap,
      createMirrorSourceMap,
      setSourceContent,
      getSources,
    },
  } = dependencies;
  const { readFile } = File(dependencies);
  return {
    extractSourceMap: (file) => {
      const source_map_url = extractSourceMapURL(file);
      if (source_map_url === null) {
        return createMirrorSourceMap(file);
      }
      const either = readFile(source_map_url);
      if (isLeft(either)) {
        logWarning(
          "Cannot read source map file %j\n  Referenced in script file at %j\n  >> %s",
          source_map_url,
          file.url,
          fromLeft(either),
        );
        return createMirrorSourceMap(file);
      }
      const mapping = createSourceMap(fromRight(either));
      for (const { url, content } of getSources(mapping)) {
        if (content === null) {
          const either = readFile(url);
          if (isLeft(either)) {
            logWarning(
              "Cannot read source file %j\n  Referenced in source map file %j\n  Referenced in script file %j\n  >> %s",
              url,
              source_map_url,
              file.url,
              fromLeft(either),
            );
            return createMirrorSourceMap(file);
          }
          setSourceContent(mapping, fromRight(either));
        }
      }
      return mapping;
    },
  };
};
