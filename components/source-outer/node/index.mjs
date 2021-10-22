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
  const { readFile, readFileAsync } = File(dependencies);
  return {
    extractSourceMap: (file) => {
      const source_map_url = extractSourceMapURL(file);
      if (source_map_url === null) {
        return createMirrorSourceMap(file);
      }
      const either = readFile(source_map_url);
      if (isLeft(either)) {
        logWarning(
          "Cannot read source map file at %j which is referenced in script file %j >> %s",
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
              "Cannot read source file at %j which is referenced in source map file %j which is referenced in script file %j >> %s",
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
    extractSourceMapAsync: async (file) => {
      const source_map_url = extractSourceMapURL(file);
      if (source_map_url === null) {
        return createMirrorSourceMap(file);
      }
      const either = await readFileAsync(source_map_url);
      if (isLeft(either)) {
        logWarning(
          "Cannot read source map file at %j which is referenced in script file %j >> %s",
          source_map_url,
          file.url,
          fromLeft(either),
        );
        return createMirrorSourceMap(file);
      }
      const mapping = createSourceMap(fromRight(either));
      for (const { url, content } of getSources(mapping)) {
        if (content === null) {
          const either = await readFileAsync(url);
          if (isLeft(either)) {
            logWarning(
              "Cannot read source file at %j which is referenced in source map file %j which is referenced in script file %j >> %s",
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
