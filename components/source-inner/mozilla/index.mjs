import SourceMap from "source-map";

const { SourceMapConsumer } = SourceMap;

export default (dependencies) => {
  const {
    location: { makeLocation },
  } = dependencies;
  return {
    compileSourceMap: (payload) => new SourceMapConsumer(payload),
    mapSource: (mapping, line1, column1) => {
      const {
        source: url2,
        line: line2,
        column: column2,
      } = mapping.originalPositionFor({ line: line1, column: column1 });
      if (url2 === null || line2 === null || column2 === null) {
        return null;
      }
      return makeLocation(url2, line2, column2);
    },
  };
};
