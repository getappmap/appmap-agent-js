import OperatingSystem from "os";

const { platform: getPlatform } = OperatingSystem;

export default (dependencies) => {
  if (getPlatform() === "win32") {
    return {
      sanitizeFilename: (path, replace) =>
        path.replace(/[\u0000-\u001F\\/<>:"|?*]/gu, replace),
      getPathSeparator: () => "\\",
      getPathSplitter: () => /[\\/]/gu,
      isAbsolutePath: (path) => /^[a-zA-Z]:[\\/]/u.test(path),
    };
  } else {
    return {
      sanitizeFilename: (path, replace) => path.replace(/[\u0000/]/gu, replace),
      getPathSeparator: () => "/",
      getPathSplitter: () => "/",
      isAbsolutePath: (path) => path !== "" && path[0] === "/",
    };
  }
};
