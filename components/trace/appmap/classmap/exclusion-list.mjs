import Exclusion from "./exclusion.mjs";

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
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
      assert(false, "missing matched exclusion");
    },
  };
};
