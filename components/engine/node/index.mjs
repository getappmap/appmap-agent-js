const { version } = process;

export default (dependencies) => {
  return {
    getEngine: () => `node@${version}`,
  };
};
