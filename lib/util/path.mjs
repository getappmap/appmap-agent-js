import { expect } from "./expect.mjs";

const getNormalizedParts = (path) => {
  expect(path[0] === "/", "expected an absolute path but got: %o", path);
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

export const makeRelativePath = (path1, path2) => {
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
  return [...parts1.slice(index).fill(".."), ...parts2.slice(index)].join("/");
};
