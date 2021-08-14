import { assert } from "./assert.mjs";

const assertAbsolutePath = (path) => {
  assert(path[0] === "/", "expected an absolute path");
};

const getNormalizedParts = (path) => {
  const stack = [];
  for (const part of path.split("/")) {
    if (part === "..") {
      stack.pop();
    } else if (part !== "." && part !== "") {
      stack.push(part);
    }
  }
  return stack;
};

export const toRelativePath = (path1, path2) => {
  assertAbsolutePath(path1);
  assertAbsolutePath(path2);
  const parts1 = getNormalizedParts(path1);
  const parts2 = getNormalizedParts(path2);
  let index = 0;
  while (
    index < parts1.length &&
    index < parts2.length &&
    parts1[index] === parts2[index]
  ) {
    index += 1;
  }
  const parts = [...parts1.slice(index).fill(".."), ...parts2.slice(index)];
  const { length } = parts;
  if (length === 0) {
    return ".";
  }
  return parts.join("/");
};

export const toAbsolutePath = (path1, path2) => {
  assertAbsolutePath(path1);
  if (path2[0] === "/") {
    return `/${getNormalizedParts(path2).join("/")}`;
  }
  const parts1 = getNormalizedParts(path1);
  const parts2 = getNormalizedParts(path2);
  return ["", ...parts1, ...parts2].join("/");
};

export const getFilename = (path) => {
  const segments = path.split("/");
  return segments[segments.length - 1];
};

export const getBasename = (path) => getFilename(path).split(".")[0];

export const getExtension = (path) =>
  getFilename(path).split(".").slice(1).join(".");

export const getDirectory = (path) => {
  const segments = path.split("/");
  segments.pop();
  return segments.join("/");
};
