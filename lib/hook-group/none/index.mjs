export default (dependencies) => {
  const {
    util: { identity },
  } = dependencies;
  return {
    hookGroupAsync: ({promise}) => promise,
  };
};
