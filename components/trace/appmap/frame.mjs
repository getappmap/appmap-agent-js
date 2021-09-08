export default (dependencies) => {
  return {
    isBundleFrame: ({ type }) => type === "bundle",
    isJumpFrame: ({ type }) => type === "jump",
    createBundleFrame: (begin) => ({
      type: "bundle",
      begin,
      between: [],
      end: null,
    }),
    createJumpFrame: (before) => ({
      type: "jump",
      before,
      after: null,
    }),
  };
};
