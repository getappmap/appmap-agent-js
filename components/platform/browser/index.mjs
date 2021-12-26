export default (dependencies) => {
  return {
    sanitizeFilename: (path, replace) => path.replace(/[\u0000/]/gu, replace),
    getPathSeparator: () => "/",
    getPathSplitter: () => "/",
    isAbsolutePath: (path) => path.startsWith("/"),
  };
};
