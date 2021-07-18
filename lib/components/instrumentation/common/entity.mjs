import Caption from "./caption.mjs";

export default (dependencies) => {
  const { makeCaption } = Caption(dependencies);
  return {
    makeEntity: (index, lineage, info) => {
      const {
        head: { type, start, end, loc },
      } = lineage;
      return {
        index,
        type,
        span: [start, end],
        loc,
        info,
        caption: makeCaption(lineage),
      };
    },
  };
};
