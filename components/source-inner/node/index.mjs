import { SourceMap } from "module";

export default (dependencies) => {
  const {
    util: { hasOwnProperty },
  } = dependencies;
  return {
    compileSourceMap: (payload) => new SourceMap(payload),
    mapSource: (mapping, line1, column1) => {
      const entry = mapping.findEntry(line1, column1);
      if (!hasOwnProperty(entry, "originalSource")) {
        return null;
      }
      const {
        originalSource: url2,
        originalLine: line2,
        originalColumn: column2,
      } = entry;
      return {
        url: url2,
        line: line2 + 1, // line is 0-indexed but should be 1-indexed
        column: column2,
      };
    },
  };
};
