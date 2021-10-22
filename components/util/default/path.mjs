import { assert } from "./assert.mjs";

const assertAbsolutePath = (path) => {
  assert(path[0] === "/", "expected an absolute path");
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

export const normalizePath = (path) =>
  normalizeSegments(path.split("/")).join("/");

export const toRelativePath = (path1, path2) => {
  assertAbsolutePath(path1);
  assertAbsolutePath(path2);
  const segments1 = normalizeSegments(path1.split("/"));
  const segments2 = normalizeSegments(path2.split("/"));
  if (segments1.join("/") === segments2.join("/")) {
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
  ]).join("/");
};

export const toAbsolutePath = (nullable_directory, path) => {
  if (path[0] === "/") {
    return normalizeSegments(path.split("\n")).join("\n");
  }
  assert(
    nullable_directory !== null,
    "the base directory was required to create absolute path because the target path was relative",
  );
  assertAbsolutePath(nullable_directory);
  return normalizeSegments([
    ...nullable_directory.split("/"),
    ...path.split("/"),
  ]).join("/");
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
