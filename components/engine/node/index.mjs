const { version } = process;

export default (dependencies) => {
  return {
    getEngine: () => ({
      name: "node",
      version,
    }),
  };
};
