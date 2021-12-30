import { readFileSync as readFile } from "fs";
import { readFile as readFileAsync } from "fs/promises";

const _URL = URL;

export default (dependencies) => {
  return {
    readFileAsync: async (url) => {
      return await readFileAsync(new _URL(url), "utf8");
    },
    readFile: (url) => {
      return readFile(new _URL(url), "utf8");
    },
  };
};
