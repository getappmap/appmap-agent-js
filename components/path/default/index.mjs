const _RegExp = RegExp;

export default (dependencies) => {
  const {
    util: { assert, identity },
    platform: { getPathSeparator, isAbsolutePath, sanitizeFilename },
  } = dependencies;

  const separator = getPathSeparator();

  const assertAbsolutePath = (path) => {
    assert(isAbsolutePath(path), "expected an absolute path");
  };

  const normalizeSegments = (segments) => {
    const stack = [];
    for (const segment of segments) {
      if (segment !== "." && segment !== "") {
        if (
          segment === ".." &&
          stack.length > 0 &&
          stack[stack.length - 1] !== ".."
        ) {
          stack.pop();
        } else {
          stack.push(segment);
        }
      }
    }
    if (segments[0] === "") {
      stack.unshift("");
    }
    return stack;
  };

  const normalizePath = (path) =>
    normalizeSegments(path.split(separator)).join(separator);

  const toRelativePath = (path1, path2) => {
    assertAbsolutePath(path1);
    assertAbsolutePath(path2);
    const segments1 = normalizeSegments(path1.split(separator));
    const segments2 = normalizeSegments(path2.split(separator));
    if (segments1.join(separator) === segments2.join(separator)) {
      return ".";
    }
    let index = 0;
    while (
      index < segments1.length &&
      index < segments2.length &&
      segments1[index] === segments2[index]
    ) {
      index += 1;
    }
    return normalizeSegments([
      ...segments1.slice(index).fill(".."),
      ...segments2.slice(index),
    ]).join(separator);
  };

  let toForwardSlashPath = identity;
  let fromForwardSlashPath = identity;
  if (separator !== "/") {
    const regexp = new _RegExp(`\\${separator}`, "gu");
    toForwardSlashPath = (path) => path.replace(regexp, "/");
    fromForwardSlashPath = (path) => path.replace(/\//gu, separator);
  }

  const toAbsolutePath = (nullable_directory, path) => {
    if (isAbsolutePath(path)) {
      return normalizePath(path);
    }
    assert(
      nullable_directory !== null,
      "the base directory was required to create absolute path because the target path was relative",
    );
    assertAbsolutePath(nullable_directory);
    return normalizeSegments([
      ...nullable_directory.split(separator),
      ...path.split(separator),
    ]).join(separator);
  };

  const getFilename = (path) => {
    const segments = path.split(separator);
    return segments[segments.length - 1];
  };

  const getBasename = (path) => getFilename(path).split(".")[0];

  const getExtension = (path) =>
    getFilename(path).split(".").slice(1).join(".");

  const getDirectory = (path) => {
    const segments = path.split(separator);
    if (isAbsolutePath(path) && segments.length === 2) {
      return path;
    } else {
      segments.pop();
      return segments.join(separator);
    }
  };

  const joinPath = (directory, filename) =>
    `${directory}${separator}${filename}`;

  return {
    toForwardSlashPath,
    fromForwardSlashPath,
    isAbsolutePath,
    normalizePath,
    toRelativePath,
    toAbsolutePath,
    getFilename,
    getBasename,
    getExtension,
    getDirectory,
    joinPath,
    sanitizeFilename,
  };
};
