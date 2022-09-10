const { version } = process;

export default (_dependencies) => {
  return {
    getEngine: () => `node@${version}`,
  };
};
