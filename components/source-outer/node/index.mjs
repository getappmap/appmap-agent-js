import File from "./file.mjs";

export default (dependencies) => {
  const {
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
      const mapping = createSourceMap(readFile(source_map_url));
      for (const { url, content } of getSources(mapping)) {
        if (content === null) {
          setSourceContent(mapping, readFile(url));
        }
      }
      return mapping;
    },
    extractSourceMapAsync: async (file) => {
      const source_map_url = extractSourceMapURL(file);
      if (source_map_url === null) {
        return createMirrorSourceMap(file);
      }
      const mapping = createSourceMap(await readFileAsync(source_map_url));
      for (const { url, content } of getSources(mapping)) {
        if (content === null) {
          setSourceContent(mapping, await readFileAsync(url));
        }
      }
      return mapping;
    },
  };
};
