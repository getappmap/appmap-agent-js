import { readFileSync as readFile } from "fs";
import { readFile as readFileAsync } from "fs/promises";

const _URL = URL;

export default (dependencies) => {
  const {
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
    readFileAsync: async (url) => ({
      url,
      content: await readFileAsync(extractFilePath(url), "utf8"),
    }),
    readFile: (url) => ({
      url,
      content: readFile(extractFilePath(url), "utf8"),
    }),
  };
};
