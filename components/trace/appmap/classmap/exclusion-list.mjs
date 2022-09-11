import Exclusion from "./exclusion.mjs";

const { Error } = globalThis;

export default (dependencies) => {
  const {
    compileExclusion,
    isExclusionMatched,
    isExcluded,
    isRecursivelyExclued,
  } = Exclusion(dependencies);
  return {
    compileExclusionList: (exclusions) => exclusions.map(compileExclusion),
    matchExclusionList: (exclusions, entity, parent) => {
      for (const exclusion of exclusions) {
        if (isExclusionMatched(exclusion, entity, parent)) {
          return {
            excluded: isExcluded(exclusion),
            recursive: isRecursivelyExclued(exclusion),
          };
        }
      }
      throw new Error("missing matched exclusion");
    },
  };
};
