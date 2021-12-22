import OperatingSystem from "os";

const { platform: getPlatform } = OperatingSystem;

export default (dependencies) => {
  const platform = getPlatform();
  return {
    sanitizeFilename:
      platform === "win32"
        ? // https://stackoverflow.com/questions/1976007/what-characters-are-forbidden-in-windows-and-linux-directory-names
          (path, replace) =>
            path.replace(/[\u0000-\u001F\\/<>:"|?*]/gu, replace)
        : (path, replace) => path.replace(/[\u0000/]/gu, replace),
    getPathSeparator: platform === "win32" ? () => "\\" : () => "/",
    isAbsolutePath:
      platform === "win32"
        ? (path) => /^[a-zA-Z]:\\/u.test(path)
        : (path) => path.startsWith("/"),
  };
};
