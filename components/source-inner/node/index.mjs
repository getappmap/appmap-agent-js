import { SourceMap } from "module";

// The node implementation for source map fails on juice shop's source map...

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
        line: line2 + 1, // 0-indexed line
        column: column2,
      };
    },
  };
};
