const { Error, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { isExclusionMatched, isExcluded, isRecursivelyExclued } = await import(
  `./exclusion.mjs${__search}`
);

export const matchExclusionList = (exclusions, entity, parent) => {
  for (const exclusion of exclusions) {
    if (isExclusionMatched(exclusion, entity, parent)) {
      return {
        excluded: isExcluded(exclusion),
        recursive: isRecursivelyExclued(exclusion),
      };
    }
  }
  throw new Error("missing matched exclusion");
};
