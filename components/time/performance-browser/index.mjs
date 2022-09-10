/* eslint-env browser */

const {
  performance: { now },
} = globalThis;

export default (_dependencies) => {
  return { now };
};
