
const {
  process: {version},
} = globalThis;

export default (_dependencies) => {
  return {
    getEngine: () => `node@${version}`,
  };
};
