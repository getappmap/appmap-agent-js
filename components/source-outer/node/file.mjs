import { readFileSync as readFile } from "fs";
import { readFile as readFileAsync } from "fs/promises";

const _URL = URL;

export default (dependencies) => {
  const {
    util: { makeLeft, makeRight },
    expect: { expect },
  } = dependencies;
  const extractFilePath = (url) => {
    const { protocol, pathname } = new _URL(url);
    expect(
      protocol === "file:",
      "Expected file protocol in url but got: %j",
      url,
    );
    return pathname;
  };
  return {
    readFileAsync: async (url) => {
      const path = extractFilePath(url);
      try {
        return makeRight({
          url,
          content: await readFileAsync(path, "utf8"),
        });
      } catch ({ message }) {
        return makeLeft(message);
      }
    },
    readFile: (url) => {
      const path = extractFilePath(url);
      try {
        return makeRight({
          url,
          content: readFile(path, "utf8"),
        });
      } catch ({ message }) {
        return makeLeft(message);
      }
    },
  };
};
