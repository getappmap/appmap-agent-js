
const { entries } = Object;
const _Map = Map;
const _undefined = undefined;
const _String = String;
const { isArray } = Array;

export default (dependencies) => {
  const {
    util: { createCounter, toRelativePath, hasOwnProperty },
    naming: { parseQualifiedName, getQualifiedName },
  } = dependencies;
  return {
    createMetadata: ({}) => ({

    })
  }
};
