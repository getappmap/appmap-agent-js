const {
  process: { version },
} = globalThis;

export default (_dependencies) => ({
  getEngine: () => `node@${version}`,
});
